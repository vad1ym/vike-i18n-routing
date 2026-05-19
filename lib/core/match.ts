import { buildRoutePath, matchRoutePattern, normalizePathname } from './route-patterns'
import {
  canonicalizeParamValue,
  localizeParamValue,
  type ParamVariants,
} from './variants'
import type {
  FlatI18nRoutes,
  LocaleCode,
  PageContextLocaleConfig,
} from './types'

export type RouteMatch = {
  canonicalPattern: string
  localizedPatterns: Record<string, string>
  canonicalPath: string
  matchedLocale: string
  params: Record<string, string>
}

export type KnownRouteMatch = {
  params: Record<string, string>
  matchedLocale?: string
  matchedLocalized: boolean
}

export type RouteEntry = {
  canonicalPattern: string
  localizedPatterns: Record<string, string>
  normalizedLocalized?: Record<string, string>
}

type SegmentTemplate = {
  staticPrefix: string[]
  segmentCount: number
  segments: (null | Record<string, string>)[]
  paramNames: (string | null)[]
  localizedSegments: Record<string, (string | null)[]>
}

type IndexedRouteEntry = RouteEntry & { template: SegmentTemplate }

type DynamicTrieNode = {
  staticChildren: Map<string, DynamicTrieNode>
  paramChild?: DynamicTrieNode
  paramName?: string
  entry?: IndexedRouteEntry
}

type DynamicTrieMatch = {
  entry: IndexedRouteEntry
  locale: string
  params: Record<string, string>
}

export type LocaleCacheEntry = Record<string, string> & {
  _miss?: (canonicalPath: string, locale: LocaleCode, localeConfig: PageContextLocaleConfig) => string
}

export type RouteIndex = {
  routes: FlatI18nRoutes
  static: Map<string, RouteEntry>
  staticByLocalized: Map<string, RouteEntry>
  dynamicBySegments: Map<number, IndexedRouteEntry[]>
  dynamicOptionalBySegments: Map<number, IndexedRouteEntry[]>
  dynamicTrieByLocale: Record<string, Map<number, DynamicTrieNode>>
  dynamic: RouteEntry[]
  _localizeCache: Map<string, LocaleCacheEntry>
}

export type RouteDescriptorMetadata = {
  isStatic: boolean
  hasOptionalSegments: boolean
  paramNames?: string[]
  localizedSegments?: Record<string, (string | null)[]>
}

function buildConcretePath(
  paramVariants: ParamVariants,
  pattern: string,
  params: Record<string, string | undefined>,
  localeConfig: PageContextLocaleConfig,
  locale = localeConfig.defaultLocale,
): string {
  if (paramVariants.size === 0) return buildRoutePath(pattern, params)

  const localizedParams = Object.fromEntries(
    Object.entries(params).map(([name, value]) => [
      name,
      value ? localizeParamValue(paramVariants, name, value, localeConfig, locale) : value,
    ]),
  )

  return buildRoutePath(pattern, localizedParams)
}

function matchConcretePath(
  paramVariants: ParamVariants,
  pattern: string,
  pathname: string,
  localeConfig: PageContextLocaleConfig,
): Record<string, string> | null {
  const params = matchRoutePattern(pattern, pathname)
  if (!params) return null
  if (paramVariants.size === 0) return params as Record<string, string>

  return Object.fromEntries(
    Object.entries(params).map(([name, value]) => [
      name,
      value ? canonicalizeParamValue(paramVariants, name, value, localeConfig) : '',
    ]),
  )
}

function canonicalizeParams(
  paramVariants: ParamVariants,
  params: Record<string, string>,
  localeConfig: PageContextLocaleConfig,
): Record<string, string> {
  if (paramVariants.size === 0) return params
  return Object.fromEntries(
    Object.entries(params).map(([name, value]) => [
      name,
      value ? canonicalizeParamValue(paramVariants, name, value, localeConfig) : '',
    ]),
  )
}

export function getLocalizedPattern(
  localizedPatterns: Record<string, string>,
  canonicalPattern: string,
  locale: string,
): string {
  return localizedPatterns[locale] ?? canonicalPattern
}

export function findLocalizedRouteMatch(
  index: RouteIndex,
  paramVariants: ParamVariants,
  pathname: string,
  localeConfig: PageContextLocaleConfig,
  preferredLocale?: string,
): RouteMatch | null {
  const normalizedPathname = normalizePathname(pathname)
  const localeKeys = Object.keys(localeConfig.locales)
  const orderedLocales = !preferredLocale || localeKeys[0] === preferredLocale
    ? localeKeys
    : [preferredLocale, ...localeKeys.filter((l) => l !== preferredLocale)]

  const staticEntry = index.staticByLocalized.get(normalizedPathname)
  if (staticEntry) {
    let matchedLocale = localeConfig.defaultLocale
    if (normalizedPathname !== staticEntry.canonicalPattern) {
      for (const locale of orderedLocales) {
        if (staticEntry.normalizedLocalized?.[locale] === normalizedPathname) {
          matchedLocale = locale
          break
        }
      }
    }

    return {
      canonicalPattern: staticEntry.canonicalPattern,
      localizedPatterns: staticEntry.localizedPatterns,
      params: {},
      matchedLocale,
      canonicalPath: normalizePathname(staticEntry.canonicalPattern),
    }
  }

  const inputSegments = normalizedPathname.split('/').filter(Boolean)
  const localizedTrieMatch = findDynamicTrieMatch(index, inputSegments, orderedLocales)
  if (localizedTrieMatch) {
    const canonicalParams = canonicalizeParams(paramVariants, localizedTrieMatch.params, localeConfig)
    return {
      canonicalPattern: localizedTrieMatch.entry.canonicalPattern,
      localizedPatterns: localizedTrieMatch.entry.localizedPatterns,
      params: canonicalParams,
      matchedLocale: localizedTrieMatch.locale,
      canonicalPath: buildConcretePath(paramVariants, localizedTrieMatch.entry.canonicalPattern, canonicalParams, localeConfig),
    }
  }

  const candidates = index.dynamicOptionalBySegments.get(inputSegments.length)
  if (candidates) {
    for (const candidate of candidates) {
      for (const locale of orderedLocales) {
        const pattern = getLocalizedPattern(candidate.localizedPatterns, candidate.canonicalPattern, locale)
        const params = matchConcretePath(paramVariants, pattern, normalizedPathname, localeConfig)
        if (!params) continue

        return {
          canonicalPattern: candidate.canonicalPattern,
          localizedPatterns: candidate.localizedPatterns,
          params,
          matchedLocale: locale,
          canonicalPath: buildConcretePath(paramVariants, candidate.canonicalPattern, params, localeConfig),
        }
      }
    }
  }

  return null
}

export function findCanonicalRouteMatch(
  index: RouteIndex,
  paramVariants: ParamVariants,
  pathname: string,
  localeConfig: PageContextLocaleConfig,
): RouteMatch | null {
  const normalizedPathname = normalizePathname(pathname)
  const staticEntry = index.static.get(normalizedPathname)
  if (staticEntry) {
    return {
      canonicalPattern: staticEntry.canonicalPattern,
      localizedPatterns: staticEntry.localizedPatterns,
      params: {},
      matchedLocale: localeConfig.defaultLocale,
      canonicalPath: normalizedPathname,
    }
  }

  const inputSegments = normalizedPathname.split('/').filter(Boolean)
  const canonicalTrieMatch = findDynamicTrieMatch(index, inputSegments, ['_canon'])
  if (canonicalTrieMatch) {
    const canonicalParams = canonicalizeParams(paramVariants, canonicalTrieMatch.params, localeConfig)
    return {
      canonicalPattern: canonicalTrieMatch.entry.canonicalPattern,
      localizedPatterns: canonicalTrieMatch.entry.localizedPatterns,
      params: canonicalParams,
      matchedLocale: localeConfig.defaultLocale,
      canonicalPath: buildConcretePath(paramVariants, canonicalTrieMatch.entry.canonicalPattern, canonicalParams, localeConfig),
    }
  }

  const candidates = index.dynamicOptionalBySegments.get(inputSegments.length)
  if (candidates) {
    for (const candidate of candidates) {
      const params = matchConcretePath(paramVariants, candidate.canonicalPattern, normalizedPathname, localeConfig)
      if (!params) continue

      return {
        canonicalPattern: candidate.canonicalPattern,
        localizedPatterns: candidate.localizedPatterns,
        params,
        matchedLocale: localeConfig.defaultLocale,
        canonicalPath: buildConcretePath(paramVariants, candidate.canonicalPattern, params, localeConfig),
      }
    }
  }

  return null
}

export function resolveKnownRouteMatch(
  canonicalPattern: string,
  localizedPatterns: Record<string, string>,
  paramVariants: ParamVariants,
  localizedRequestUrl: string,
  localeConfig: PageContextLocaleConfig,
  preferredLocale: string,
): KnownRouteMatch | null {
  const orderedLocales = Object.keys(localeConfig.locales)
  if (orderedLocales[0] !== preferredLocale) {
    orderedLocales.splice(orderedLocales.indexOf(preferredLocale), 1)
    orderedLocales.unshift(preferredLocale)
  }

  for (const locale of orderedLocales) {
    const pattern = getLocalizedPattern(localizedPatterns, canonicalPattern, locale)
    const params = matchConcretePath(paramVariants, pattern, localizedRequestUrl, localeConfig)
    if (!params) continue

    return { params, matchedLocale: locale, matchedLocalized: true }
  }

  const canonicalParams = matchConcretePath(paramVariants, canonicalPattern, localizedRequestUrl, localeConfig)
  if (!canonicalParams) return null
  return { params: canonicalParams, matchedLocalized: false }
}

function buildSegmentTemplate(
  canonicalPattern: string,
  localizedPatterns: Record<string, string>,
): SegmentTemplate {
  const hasOptional = canonicalPattern.includes('{')
  const cleanCanonical = canonicalPattern.replace(/[{}]/g, '')
  const canonicalSegs = cleanCanonical.split('/').filter(Boolean)
  const localizedSegs: Record<string, string[]> = {}

  for (const [locale, pattern] of Object.entries(localizedPatterns)) {
    localizedSegs[locale] = pattern.replace(/[{}]/g, '').split('/').filter(Boolean)
  }

  const staticPrefix: string[] = []
  const segments: (null | Record<string, string>)[] = []
  const paramNames: (string | null)[] = []
  let prefixDone = false

  for (let i = 0; i < canonicalSegs.length; i++) {
    const seg = canonicalSegs[i]
    const isParam = seg.startsWith(':') || seg.startsWith('@')
    if (isParam) {
      prefixDone = true
      segments.push(null)
      paramNames.push(seg.slice(1))
    } else {
      const localeMap: Record<string, string> = {}
      for (const [locale, segs] of Object.entries(localizedSegs)) {
        localeMap[locale] = segs[i] ?? seg
      }
      segments.push(localeMap)
      paramNames.push(null)
      if (!prefixDone) staticPrefix.push(seg)
    }
  }

  const localizedSegmentsMap: Record<string, (string | null)[]> = {}
  const canonResult: (string | null)[] = []
  for (let i = 0; i < canonicalSegs.length; i++) {
    const seg = canonicalSegs[i]
    canonResult.push((seg.startsWith(':') || seg.startsWith('@')) ? null : seg)
  }
  localizedSegmentsMap._canon = canonResult

  for (const locale of Object.keys(localizedSegs)) {
    const segs = localizedSegs[locale]
    const result: (string | null)[] = []
    for (let i = 0; i < canonicalSegs.length; i++) {
      const canonSeg = canonicalSegs[i]
      result.push((canonSeg.startsWith(':') || canonSeg.startsWith('@')) ? null : (segs[i] ?? canonSeg))
    }
    localizedSegmentsMap[locale] = result
  }

  return { staticPrefix, segmentCount: hasOptional ? -1 : canonicalSegs.length, segments, paramNames, localizedSegments: localizedSegmentsMap }
}

function createDynamicTrieNode(): DynamicTrieNode {
  return { staticChildren: new Map() }
}

function insertDynamicTrie(
  root: DynamicTrieNode,
  segments: (string | null)[],
  paramNames: (string | null)[],
  entry: IndexedRouteEntry,
): void {
  let node = root
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    if (segment === null) {
      if (!node.paramChild) {
        node.paramChild = createDynamicTrieNode()
        node.paramChild.paramName = paramNames[i] ?? undefined
      }
      node = node.paramChild
      continue
    }
    let child = node.staticChildren.get(segment)
    if (!child) {
      child = createDynamicTrieNode()
      node.staticChildren.set(segment, child)
    }
    node = child
  }
  if (!node.entry) node.entry = entry
}

function findDynamicTrieMatch(
  index: RouteIndex,
  inputSegments: string[],
  locales: string[],
): DynamicTrieMatch | null {
  const segmentCount = inputSegments.length
  for (const locale of locales) {
    const trieBySegments = index.dynamicTrieByLocale[locale]
    const root = trieBySegments?.get(segmentCount)
    if (!root) continue
    let node: DynamicTrieNode = root
    const params: Record<string, string> = {}
    let matched = true
    for (let i = 0; i < segmentCount; i++) {
      const input = inputSegments[i]
      const staticChild = node.staticChildren.get(input)
      if (staticChild) {
        node = staticChild
        continue
      }
      if (node.paramChild) {
        node = node.paramChild
        if (node.paramName) params[node.paramName] = input
        continue
      }
      matched = false
      break
    }
    if (matched && node.entry) return { entry: node.entry, locale, params }
  }
  return null
}

export function buildRouteIndex(routes: FlatI18nRoutes): RouteIndex {
  const staticMap = new Map<string, RouteEntry>()
  const staticByLocalized = new Map<string, RouteEntry>()
  const dynamic: RouteEntry[] = []

  for (const [canonicalPattern, localizedPatterns] of Object.entries(routes)) {
    const entry: RouteEntry = { canonicalPattern, localizedPatterns }
    const isDynamic = canonicalPattern.includes(':') || canonicalPattern.includes('@')
    if (isDynamic) {
      dynamic.push(entry)
    } else {
      const normalizedLocalized: Record<string, string> = {}
      for (const [loc, path] of Object.entries(localizedPatterns)) {
        normalizedLocalized[loc] = normalizePathname(path)
      }
      entry.normalizedLocalized = normalizedLocalized
      const normalizedCanonical = normalizePathname(canonicalPattern)
      staticMap.set(normalizedCanonical, entry)
      staticByLocalized.set(normalizedCanonical, entry)
      for (const normalized of Object.values(normalizedLocalized)) {
        staticByLocalized.set(normalized, entry)
      }
    }
  }

  dynamic.sort((a, b) => b.canonicalPattern.length - a.canonicalPattern.length)
  const indexedDynamic: IndexedRouteEntry[] = dynamic.map((entry) => ({ ...entry, template: buildSegmentTemplate(entry.canonicalPattern, entry.localizedPatterns) }))
  const dynamicBySegments = new Map<number, IndexedRouteEntry[]>()
  const dynamicOptionalBySegments = new Map<number, IndexedRouteEntry[]>()
  const dynamicTrieByLocale: Record<string, Map<number, DynamicTrieNode>> = {}

  for (const entry of indexedDynamic) {
    const { segmentCount, staticPrefix } = entry.template
    if (segmentCount === -1) {
      const base = entry.canonicalPattern.replace(/\{[^}]*\}/g, '').split('/').filter(Boolean).length
      const optionalSegs = (entry.canonicalPattern.match(/\{/g) || []).length
      for (let i = base; i <= base + optionalSegs; i++) {
        let bucket = dynamicBySegments.get(i)
        if (!bucket) { bucket = []; dynamicBySegments.set(i, bucket) }
        bucket.push(entry)
        let optionalBucket = dynamicOptionalBySegments.get(i)
        if (!optionalBucket) { optionalBucket = []; dynamicOptionalBySegments.set(i, optionalBucket) }
        optionalBucket.push(entry)
      }
      void staticPrefix
    } else {
      let bucket = dynamicBySegments.get(segmentCount)
      if (!bucket) { bucket = []; dynamicBySegments.set(segmentCount, bucket) }
      bucket.push(entry)
      for (const [locale, segments] of Object.entries(entry.template.localizedSegments)) {
        let trieBySegments = dynamicTrieByLocale[locale]
        if (!trieBySegments) {
          trieBySegments = new Map()
          dynamicTrieByLocale[locale] = trieBySegments
        }
        let root = trieBySegments.get(segmentCount)
        if (!root) {
          root = createDynamicTrieNode()
          trieBySegments.set(segmentCount, root)
        }
        insertDynamicTrie(root, segments, entry.template.paramNames, entry)
      }
    }
  }

  return {
    routes,
    static: staticMap,
    staticByLocalized,
    dynamicBySegments,
    dynamicOptionalBySegments,
    dynamicTrieByLocale,
    dynamic,
    _localizeCache: new Map(),
  }
}

export function getRouteDescriptorMetadata(
  index: RouteIndex,
  routeKey: string,
): RouteDescriptorMetadata | undefined {
  const staticEntry = index.static.get(routeKey)
  if (staticEntry) {
    return {
      isStatic: true,
      hasOptionalSegments: false,
    }
  }

  for (const bucket of index.dynamicBySegments.values()) {
    for (const entry of bucket) {
      if (entry.canonicalPattern !== routeKey) continue
      const paramNames = entry.template.paramNames.filter(Boolean) as string[]
      return {
        isStatic: false,
        hasOptionalSegments: entry.template.segmentCount === -1,
        paramNames,
        localizedSegments: entry.template.segmentCount === -1
          ? undefined
          : entry.template.localizedSegments,
      }
    }
  }

  return undefined
}
