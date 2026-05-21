import { buildAliasIndex, buildAliasAlternateUrls, resolveAlias, type AliasIndex } from './aliases'
import { detectDomain, resolveDomainConfigForDomain } from './domain/normalize'
import { applyLocalePrefix, applyTrailingSlash, buildLocalizedUrl, buildSetLocaleRedirect, buildUrl } from './format'
import { detectRequestLocale } from './locale/detector'
import {
  buildRouteIndex,
  findCanonicalRouteMatch,
  findLocalizedRouteMatch,
  getRouteDescriptorMetadata,
  getLocalizedPattern,
  resolveKnownRouteMatch,
  type RouteDescriptorMetadata,
  type LocaleCacheEntry,
  type RouteEntry,
  type RouteIndex,
} from './match'
import { getI18nConfig } from './pageContext'
import { resolveConfigRedirect, validateRedirectConfig } from './redirects'
import { buildRoutePath, matchRoutePattern, normalizePathname } from './route-patterns'
import { normalizeRoutes } from './routes'
import { validateI18nConfig } from './validate'
import {
  canonicalizeParamValue,
  canonicalizeQueryParams,
  localizeNamedQueryValue,
  localizeParamValue,
  localizeQueryParams,
  sanitizeRouteSearchParams,
  type ParamVariants,
  type QueryVariants,
} from './variants'
import type {
  AlternateUrl,
  I18nConfig,
  I18nPageContext,
  I18nRoute,
  LocaleCode,
  LocalizedPathOptions,
  PageContextLocaleConfig,
  ParamVariantConfig,
  QueryVariantConfig,
  RedirectConfig,
  RedirectStatusCode,
  ResolvedDomainConfig,
  RouteDescriptor,
  TrailingSlash,
} from './types'

function normalizeRoutingPathname(pathname: string): string {
  const normalized = normalizePathname(pathname)

  if (normalized.endsWith('/index.pageContext.json')) {
    const base = normalized.slice(0, -'/index.pageContext.json'.length)
    return base || '/'
  }

  if (normalized.endsWith('.pageContext.json')) {
    const base = normalized.slice(0, -'.pageContext.json'.length)
    return base || '/'
  }

  return normalized
}

// ────────────────────────────────────────────────────────────────
// Path building & matching
//
// These wrap route-patterns.ts functions with param variant awareness:
// params are automatically canonicalized on match and localized on build.
// ────────────────────────────────────────────────────────────────

// Builds a concrete URL from a pattern by localizing all param values for the target locale.
// Example: pattern='/uslugi/:category', params={category:'web'}, locale='ru'
//   → if variant ru='veb', produces '/uslugi/veb'
function buildConcretePath(
  paramVariants: ParamVariants,
  pattern: string,
  params: Record<string, string | undefined>,
  localeConfig: PageContextLocaleConfig,
  locale = localeConfig.defaultLocale,
): string {
  // Fast path: no variants registered — params are already final
  if (paramVariants.size === 0) return buildRoutePath(pattern, params)

  const localizedParams = Object.fromEntries(
    Object.entries(params).map(([name, value]) => [
      name,
      value ? localizeParamValue(paramVariants, name, value, localeConfig, locale) : value,
    ]),
  )

  return buildRoutePath(pattern, localizedParams)
}

// Converts a canonical path (e.g. '/about') to a fully localized URL
// (e.g. '/ru/o-nas') by finding the route, building the localized path,
// and applying the locale prefix.
export function localizeCanonicalPath(context: CanonicalLocalizationContext): string {
  return localizeCanonicalPathInner(context)
}

export type RouteKeyLocalizationContext = {
  index: RouteIndex
  paramVariants: ParamVariants
  routeKey: string
  params: Record<string, string | undefined>
  locale: LocaleCode
  localeConfig: PageContextLocaleConfig
  options?: LocalizedPathOptions,
  trailingSlash?: TrailingSlash
}

export function localizeRouteKey({
  index,
  paramVariants,
  routeKey,
  params,
  locale,
  localeConfig,
  options,
  trailingSlash = 'never',
}: RouteKeyLocalizationContext): string | null {
  const localizedPatterns = index.routes[routeKey]
  if (!localizedPatterns) return null

  const localizedPath = buildConcretePath(
    paramVariants,
    getLocalizedPattern(localizedPatterns, routeKey, locale),
    params,
    localeConfig,
    locale,
  )

  return applyLocalePrefix(localizedPath, locale, localeConfig, options, trailingSlash)
}

type InternalRouteDescriptor = RouteDescriptor & {
  localizedPatterns?: Record<string, string>
  normalizedLocalized?: Record<string, string>
  metadata?: RouteDescriptorMetadata
}

export function createRouteDescriptor(
  index: RouteIndex,
  routeKey: string,
): RouteDescriptor {
  const staticEntry = index.static.get(routeKey)
  return {
    key: routeKey,
    localizedPatterns: index.routes[routeKey],
    normalizedLocalized: staticEntry?.normalizedLocalized,
    metadata: getRouteDescriptorMetadata(index, routeKey),
  } as InternalRouteDescriptor
}

type FastDescriptorPathContext = {
  route: InternalRouteDescriptor
  params: Record<string, string | undefined>
  locale: LocaleCode
  localeConfig: PageContextLocaleConfig
}

function fastFormatDescriptorPath({
  route,
  params,
  locale,
  localeConfig,
}: FastDescriptorPathContext): string | null {
  const metadata = route.metadata
  const localizedSegments = metadata?.localizedSegments?.[locale]
  if (!metadata || !localizedSegments || metadata.hasOptionalSegments) return null

  const result = new Array<string>(localizedSegments.length)
  let paramIndex = 0
  for (let i = 0; i < localizedSegments.length; i++) {
    const segment = localizedSegments[i]
    if (segment !== null) {
      result[i] = segment
      continue
    }

    const paramName = metadata.paramNames?.[paramIndex++]
    if (!paramName) return null
    const value = params[paramName]
    if (value == null) return null
    result[i] = value
  }

  return result.length === 0 ? '/' : `/${result.join('/')}`
}

export type RouteDescriptorLocalizationContext = {
  paramVariants: ParamVariants
  descriptor: RouteDescriptor
  params: Record<string, string | undefined>
  locale: LocaleCode
  localeConfig: PageContextLocaleConfig
  options?: LocalizedPathOptions,
  trailingSlash?: TrailingSlash
}

export function localizeRouteDescriptor({
  paramVariants,
  descriptor,
  params,
  locale,
  localeConfig,
  options,
  trailingSlash = 'never',
}: RouteDescriptorLocalizationContext): string | null {
  const route = descriptor as InternalRouteDescriptor
  const localizedPatterns = route.localizedPatterns
  if (!localizedPatterns) return null

  const fastPath = paramVariants.size === 0
    ? fastFormatDescriptorPath({ route, params, locale, localeConfig })
    : null
  const localizedPath = fastPath ?? buildConcretePath(
    paramVariants,
    getLocalizedPattern(localizedPatterns, route.key, locale),
    params,
    localeConfig,
    locale,
  )

  return applyLocalePrefix(localizedPath, locale, localeConfig, options, trailingSlash)
}

export type CachedRouteDescriptorLocalizationContext = {
  descriptor: RouteDescriptor
  locale: LocaleCode
  localeConfig: PageContextLocaleConfig
}

export function localizeRouteDescriptorCached({
  descriptor,
  locale,
  localeConfig,
}: CachedRouteDescriptorLocalizationContext): string | null {
  const route = descriptor as InternalRouteDescriptor
  if (!route.localizedPatterns) return null

  const staticLocalized = route.normalizedLocalized?.[locale]
  if (staticLocalized) {
    return applyLocalePrefix(staticLocalized, locale, localeConfig)
  }

  const fastPath = fastFormatDescriptorPath({ route, params: {}, locale, localeConfig })
  if (fastPath) {
    return applyLocalePrefix(fastPath, locale, localeConfig)
  }

  const metadata = route.metadata
  if (!metadata?.isStatic) return null

  const localizedPath = route.localizedPatterns[locale] ?? route.key
  return applyLocalePrefix(localizedPath, locale, localeConfig)
}

// Cached version for the hot path (no variants, no query, no options).
// Static routes bypass the cache (direct O(1) map lookup is faster).
// Dynamic routes use per-index cache keyed on "routeKey\0locale".
export type CachedCanonicalLocalizationContext = {
  index: RouteIndex
  canonicalPath: string
  locale: LocaleCode
  localeConfig: PageContextLocaleConfig
}

export function localizeCanonicalPathCached({
  index,
  canonicalPath,
  locale,
  localeConfig,
}: CachedCanonicalLocalizationContext): string {
  // Check cache first — covers both static and dynamic on repeated calls
  const cached = index._localizeCache.get(canonicalPath)
  if (cached !== undefined)
    return cached[locale] ?? (
      cached._miss
        ? cached._miss(canonicalPath, locale, localeConfig)
        : applyLocalePrefix(normalizePathname(canonicalPath), locale, localeConfig)
    )

  const canonicalPathname = normalizePathname(canonicalPath)

  // Static route — precomputed
  const staticEntry = index.static.get(canonicalPathname)
  if (staticEntry) {
    const perLocale = buildStaticCacheEntry(staticEntry, canonicalPathname, localeConfig)
    index._localizeCache.set(canonicalPath, perLocale)
    return perLocale[locale] ?? canonicalPathname
  }

  // Dynamic route — compute and cache all locales at once
  const perLocale = buildDynamicCacheEntry(index, canonicalPathname, localeConfig)
  index._localizeCache.set(canonicalPath, perLocale)
  return perLocale[locale] ?? perLocale._miss!(canonicalPath, locale, localeConfig)
}

function buildStaticCacheEntry(
  staticEntry: RouteEntry,
  canonicalPathname: string,
  localeConfig: PageContextLocaleConfig,
): LocaleCacheEntry {
  const entry: LocaleCacheEntry = {}
  for (const locale in localeConfig.locales) {
    const localizedPath = staticEntry.normalizedLocalized?.[locale] ?? canonicalPathname
    const targetLocaleConfig = localeConfig.locales[locale]
    const needsPrefix = locale !== localeConfig.defaultLocale || localeConfig.prefixDefaultLocale
    if (needsPrefix && targetLocaleConfig) {
      entry[locale] = localizedPath === '/'
        ? `/${targetLocaleConfig.urlPrefix}`
        : `/${targetLocaleConfig.urlPrefix}${localizedPath}`
    } else {
      entry[locale] = localizedPath
    }
  }
  return entry
}

function buildDynamicCacheEntry(
  index: RouteIndex,
  canonicalPathname: string,
  localeConfig: PageContextLocaleConfig,
): LocaleCacheEntry {
  const inputSegments = canonicalPathname.split('/').filter(Boolean)
  const candidates = index.dynamicBySegments.get(inputSegments.length)
  const entry: LocaleCacheEntry = {}

  if (candidates) {
    for (const candidate of candidates) {
      if (candidate.template.segmentCount === -1) continue
      const canonSegs = candidate.template.localizedSegments['_canon']
      if (!canonSegs) continue
      // Check canonical match
      let matched = true
      for (let i = 0; i < inputSegments.length; i++) {
        if (canonSegs[i] !== null && inputSegments[i] !== canonSegs[i]) { matched = false; break }
      }
      if (!matched) continue

      // Matched — build result for all locales
      for (const locale in localeConfig.locales) {
        const result = new Array<string>(inputSegments.length)
        const localizedSegs = candidate.template.localizedSegments[locale]
        if (localizedSegs) {
          for (let i = 0; i < inputSegments.length; i++) {
            result[i] = localizedSegs[i] === null ? inputSegments[i] : localizedSegs[i]!
          }
        } else {
          for (let i = 0; i < inputSegments.length; i++) result[i] = inputSegments[i]
        }

        let localizedPath = '/' + result.join('/')
        const targetLocaleConfig = localeConfig.locales[locale]
        const needsPrefix = locale !== localeConfig.defaultLocale || localeConfig.prefixDefaultLocale
        if (needsPrefix && targetLocaleConfig) {
          localizedPath = `/${targetLocaleConfig.urlPrefix}${localizedPath}`
        }
        entry[locale] = localizedPath
      }
      return entry
    }
  }

  // Fallback — regex path
  entry._miss = (cp, locale, lc) => {
    return localizeCanonicalPathInner({
      index,
      paramVariants: EMPTY_PARAM_VARIANTS_MAP,
      canonicalPath: cp,
      queryVariants: EMPTY_QUERY_VARIANTS_MAP,
      locale,
      localeConfig: lc,
    })
  }
  return entry
}

const EMPTY_PARAM_VARIANTS_MAP: ParamVariants = new Map()
const EMPTY_QUERY_VARIANTS_MAP: QueryVariants = new Map()

type CanonicalLocalizationContext = {
  index: RouteIndex
  paramVariants: ParamVariants
  canonicalPath: string
  queryVariants: QueryVariants
  locale: LocaleCode
  localeConfig: PageContextLocaleConfig
  options?: LocalizedPathOptions,
  trailingSlash?: TrailingSlash
}

function localizeCanonicalPathInner({
  index,
  paramVariants,
  canonicalPath,
  queryVariants,
  locale,
  localeConfig,
  options,
  trailingSlash = 'never',
}: CanonicalLocalizationContext): string {
  const qIndex = canonicalPath.indexOf('?')
  const hasQuery = qIndex !== -1
  const canonicalPathname = hasQuery
    ? normalizePathname(canonicalPath.slice(0, qIndex))
    : normalizePathname(canonicalPath)

  let localizedPath: string | null = null

  // Fast path: try segment-based localization (no regex)
  const staticEntry = index.static.get(canonicalPathname)
  if (staticEntry) {
    // Static route — use precomputed normalized path
    localizedPath = staticEntry.normalizedLocalized?.[locale] ?? canonicalPathname
  } else if (paramVariants.size === 0) {
    // Dynamic route without param variants — use segment template
    const inputSegments = canonicalPathname.split('/').filter(Boolean)
    const candidates = index.dynamicBySegments.get(inputSegments.length)
    if (candidates) {
      for (const candidate of candidates) {
        const result = fastLocalize(candidate.template, inputSegments, locale, paramVariants, localeConfig)
        if (result !== null) {
          localizedPath = result
          break
        }
      }
    }
  }

  // Slow fallback: regex match + build (needed for paramVariants or unmatched routes)
  if (localizedPath === null) {
    const match = findCanonicalRouteMatch(index, paramVariants, canonicalPathname, localeConfig)
    localizedPath = match
      ? buildConcretePath(
          paramVariants,
          getLocalizedPattern(match.localizedPatterns, match.canonicalPattern, locale),
          match.params,
          localeConfig,
          locale,
        )
      : canonicalPathname
  }

  // Inline prefix logic — localizedPath is already normalized, skip redundant normalizePathname
  const targetLocaleConfig = localeConfig.locales[locale]
  const needsPrefix = options?.prefix === true
    || (options?.prefix === undefined && (locale !== localeConfig.defaultLocale || localeConfig.prefixDefaultLocale))
  const prefixedPath = needsPrefix && targetLocaleConfig
    ? localizedPath === '/' ? `/${targetLocaleConfig.urlPrefix}` : `/${targetLocaleConfig.urlPrefix}${localizedPath}`
    : localizedPath
  const finalPath = applyTrailingSlash(prefixedPath, trailingSlash)

  // Fast path: no query string and no query variants — skip URLSearchParams entirely
  if (!hasQuery && queryVariants.size === 0) return finalPath

  const canonicalSearchParams = !hasQuery
    ? new URLSearchParams()
    : sanitizeRouteSearchParams(new URLSearchParams(canonicalPath.slice(qIndex + 1)))

  return buildUrl(
    finalPath,
    localizeQueryParams(queryVariants, canonicalSearchParams, localeConfig, locale),
  )
}

// ────────────────────────────────────────────────────────────────
// Variant redirect
//
// When param variants have redirect=true, visiting a URL with a "foreign"
// slug (e.g. Russian slug on English page) triggers a redirect to the
// correct locale-specific slug.
// ────────────────────────────────────────────────────────────────

// Checks if any param in the URL uses a variant from a different locale.
// If so, returns the corrected path with proper locale-specific slugs.
function getVariantRedirectPath(
  paramVariants: ParamVariants,
  canonicalPattern: string,
  localizedPatterns: Record<string, string>,
  pathname: string,
  locale: string,
  localeConfig: PageContextLocaleConfig,
): string | undefined {
  const pattern = getLocalizedPattern(localizedPatterns, canonicalPattern, locale)
  const rawParams = matchRoutePattern(pattern, pathname)
  if (!rawParams) return undefined

  const hasForeignVariant = Object.entries(rawParams).some(([name, value]) => {
    if (!value) return false
    const config = paramVariants.get(name)
    if (!config) return false

    const localizedValue = localizeParamValue(
      paramVariants,
      name,
      canonicalizeParamValue(paramVariants, name, value, localeConfig),
      localeConfig,
      locale,
    )

    return localizedValue !== value
  })

  if (!hasForeignVariant) return undefined

  const canonicalParams = Object.fromEntries(
    Object.entries(rawParams).map(([name, value]) => [
      name,
      value ? canonicalizeParamValue(paramVariants, name, value, localeConfig) : '',
    ]),
  )

  return buildConcretePath(paramVariants, pattern, canonicalParams, localeConfig, locale)
}

type CompiledDomainRouting = {
  resolved: ResolvedDomainConfig
  redirects?: RedirectConfig
  routeIndex: RouteIndex
  aliasIndex?: AliasIndex
  prefixToLocale: Record<string, LocaleCode>
}

type ResolvedRequestState = {
  explicitLocaleQuery: string | null
  rawPathname: string
  requestPath: string
  requestSearchParams: URLSearchParams
  requestUrl: string
  prefixedLocale?: string
  currentLocale: string
  defaultLocaleAccessedViaPrefix: boolean
  defaultLocaleAccessedViaQuery: boolean
  localizedRequestUrl: string
}

// Fast path: localize a canonical path using precomputed segment template.
// Returns null if the path doesn't match (wrong segment count or prefix mismatch).
type FastLocalizeTemplate = RouteIndex['dynamicBySegments'] extends Map<number, (infer E)[]>
  ? E extends { template: infer T } ? T : never
  : never

function fastLocalize(
  template: FastLocalizeTemplate,
  inputSegments: string[],
  locale: string,
  paramVariants: ParamVariants,
  localeConfig: PageContextLocaleConfig,
): string | null {
  const { segments, staticPrefix } = template

  // Quick prefix check — first N static segments must match canonical
  for (let i = 0; i < staticPrefix.length; i++) {
    if (inputSegments[i] !== staticPrefix[i]) return null
  }

  // Build result segments
  const result = new Array<string>(inputSegments.length)
  for (let i = 0; i < inputSegments.length; i++) {
    const seg = segments[i]
    if (seg === undefined) {
      // Beyond template (optional segment) — keep as-is
      result[i] = inputSegments[i]
    } else if (seg === null) {
      // Param position — localize via paramVariants if present, else keep
      if (paramVariants.size > 0) {
        // Need param name from canonical pattern — not available here cheaply.
        // Fall back to keeping as-is; paramVariants are rare in localizePath hot path.
        result[i] = inputSegments[i]
      } else {
        result[i] = inputSegments[i]
      }
    } else {
      // Static segment — use localized value
      result[i] = seg[locale] ?? inputSegments[i]
    }
  }

  return '/' + result.join('/')
}

// Cache compiled routing artifacts per i18n config object × resolved domain.
// This is the first step toward a compile-time model: route merges, redirects,
// and locale prefix lookup are built once and reused across requests.
const compiledDomainRoutingCache = new WeakMap<I18nConfig, Map<string, CompiledDomainRouting>>()

export function getCompiledDomainRouting(
  i18n: I18nConfig,
  domainKey: string | undefined,
): CompiledDomainRouting {
  validateI18nConfig(i18n)

  let byDomain = compiledDomainRoutingCache.get(i18n)
  if (!byDomain) {
    byDomain = new Map()
    compiledDomainRoutingCache.set(i18n, byDomain)
  }

  const cacheKey = domainKey ?? ''
  const cached = byDomain.get(cacheKey)
  if (cached) return cached

  const resolved = resolveDomainConfigForDomain(i18n, domainKey)
  const baseRoutes = normalizeRoutes(i18n.routes)
  const routes = resolved.routes
    ? { ...baseRoutes, ...normalizeRoutes(resolved.routes) }
    : baseRoutes
  const redirects = resolved.redirects || i18n.redirects
    ? { ...i18n.redirects, ...resolved.redirects }
    : undefined
  if (redirects) {
    validateRedirectConfig(redirects, { domain: resolved.domain })
  }
  const prefixToLocale: Record<string, LocaleCode> = {}
  for (const locale in resolved.locales) {
    prefixToLocale[resolved.locales[locale].urlPrefix] = locale
  }

  const aliasesConfig = resolved.aliases
  const compiled = {
    resolved,
    redirects,
    routeIndex: buildRouteIndex(routes),
    aliasIndex: aliasesConfig ? buildAliasIndex(aliasesConfig) : undefined,
    prefixToLocale,
  } satisfies CompiledDomainRouting
  byDomain.set(cacheKey, compiled)
  return compiled
}


function resolveConfigs(pageContext: I18nPageContext, i18n: I18nConfig) {
  const domain = detectDomain(pageContext, i18n)
  const compiled = getCompiledDomainRouting(i18n, domain)
  const resolved = compiled.resolved
  const requestLocale = detectRequestLocale(pageContext, i18n, resolved)

  const localeConfig: PageContextLocaleConfig = {
    defaultLocale: resolved.defaultLocale,
    locales: resolved.locales,
    currentLocale: requestLocale,
    currentLocaleMeta: resolved.locales[requestLocale]?.meta,
    prefixDefaultLocale: resolved.prefixDefaultLocale,
  }

  const domainConfig = resolved.domain
    ? {
        domain: resolved.domain,
        baseUrl: resolved.baseUrl,
        defaultLocale: resolved.defaultLocale,
        locales: resolved.locales,
        prefixDefaultLocale: resolved.prefixDefaultLocale,
        meta: resolved.meta,
      }
    : {
        domain: undefined as string | undefined,
        baseUrl: resolved.baseUrl,
      }

  return { requestLocale, domainConfig, localeConfig, domain, resolved, compiled }
}

// ────────────────────────────────────────────────────────────────
// Alternate URLs
// ────────────────────────────────────────────────────────────────

// Builds an array of { locale, url } for all available locales.
// Used for hreflang tags and language switchers.
function buildAlternateUrls(
  routes: RouteIndex,
  paramVariants: ParamVariants,
  canonicalPath: string,
  queryVariants: QueryVariants,
  localeConfig: PageContextLocaleConfig,
  trailingSlash: TrailingSlash = 'never',
): AlternateUrl[] {
  return Object.keys(localeConfig.locales).map((locale) => ({
    locale,
    url: localizeCanonicalPath({
      index: routes,
      paramVariants,
      canonicalPath,
      queryVariants,
      locale,
      localeConfig,
      trailingSlash,
    }),
  }))
}

function buildLocalizedPathForRoute(
  routePattern: string | undefined,
  localizedPatterns: Record<string, string> | undefined,
  params: Record<string, string>,
  paramVariants: ParamVariants,
  localeConfig: PageContextLocaleConfig,
  locale: LocaleCode,
  fallbackPath: string,
): string {
  if (!routePattern || !localizedPatterns) return fallbackPath

  return buildConcretePath(
    paramVariants,
    getLocalizedPattern(localizedPatterns, routePattern, locale),
    params,
    localeConfig,
    locale,
  )
}

// ────────────────────────────────────────────────────────────────
// Main resolution — resolveI18nRouteState
//
// This is the core of the router. It takes a raw pathname from the request
// and produces a fully resolved I18nRoute with all URL variants.
//
// Steps:
//
// 1. RESOLVE CONFIGS
//    Detect domain and locale and build localeConfig/domainConfig.
//
// 2. EXTRACT LOCALE FROM URL PREFIX
//    Check if the first URL segment is a locale prefix (e.g. "/ru/...").
//    If so, strip it to get the "bare" localized path.
//    Determine currentLocale from the prefix, or fall back to detected locale.
//
// 3. MATCH ROUTE
//    Try to match the bare path against localized patterns first
//    (e.g. "/o-nas" → matched as Russian "/about").
//    If no localized match, try canonical patterns as fallback
//    (e.g. "/about" matches directly as the canonical key).
//
// 4. BUILD URL VARIANTS
//    From the matched route and params, build:
//    - canonicalPath: the canonical form (route config key with params filled in)
//    - currentLocalePath: localized path for the current locale
//    - defaultLocalePath: localized path for the default locale
//    - currentLocaleUrl / defaultLocaleUrl: above paths with locale prefix applied
//
// 5. DETERMINE REDIRECT
//    A redirect is needed when:
//    a) A param variant with redirect=true uses a slug from the wrong locale
//       → redirect to the correct locale-specific slug
//    b) The requestUrl doesn't match the expected currentLocaleUrl
//       → redirect to the canonical URL form (e.g. add missing prefix)
//
// 6. RETURN
//    Returns I18nRoute with redirect information embedded in routeConfig.
// ────────────────────────────────────────────────────────────────

// Parse pathname and query without URL constructor (avoids ~1-2μs overhead).
// Handles both plain paths ("/foo?bar=1") and full URLs ("https://host/foo?bar=1").
function parsePathAndQuery(input: string): { pathname: string; searchParams: URLSearchParams; explicitLocaleQuery: string | null } {
  let pathStart = 0
  // Detect full URL — skip scheme + authority
  if (input.charCodeAt(0) !== 47 /* '/' */) {
    const schemeEnd = input.indexOf('://')
    if (schemeEnd !== -1) {
      pathStart = input.indexOf('/', schemeEnd + 3)
      if (pathStart === -1) pathStart = input.length
    }
  }

  const qIndex = input.indexOf('?', pathStart)
  if (qIndex === -1) {
    const pathname = pathStart === 0 ? (input || '/') : (input.slice(pathStart) || '/')
    return { pathname, searchParams: new URLSearchParams(), explicitLocaleQuery: null }
  }
  const pathname = input.slice(pathStart, qIndex) || '/'
  const queryString = input.slice(qIndex + 1)
  const searchParams = new URLSearchParams(queryString)
  const explicitLocaleQuery = searchParams.get('locale') ?? searchParams.get('lang')
  return { pathname, searchParams, explicitLocaleQuery }
}

const EMPTY_PARAM_VARIANTS_OBJ: Record<string, ParamVariantConfig> = {}
const EMPTY_QUERY_VARIANTS_OBJ: Record<string, QueryVariantConfig> = {}

function serializeParamVariants(paramVariants: ParamVariants): Record<string, ParamVariantConfig> {
  return paramVariants.size === 0 ? EMPTY_PARAM_VARIANTS_OBJ : Object.fromEntries(paramVariants)
}

function serializeQueryVariants(queryVariants: QueryVariants): Record<string, QueryVariantConfig> {
  return queryVariants.size === 0 ? EMPTY_QUERY_VARIANTS_OBJ : Object.fromEntries(queryVariants)
}

function resolveRequestState(
  request: ReturnType<typeof parsePathAndQuery>,
  localeConfig: PageContextLocaleConfig,
  detectedLocale: string,
  prefixToLocale?: Record<string, LocaleCode>,
): ResolvedRequestState {
  const normalizedPath = normalizeRoutingPathname(request.pathname)
  // Preserve raw pathname for trailing-slash detection; use normalized for routing logic
  const requestPath = normalizedPath
  const rawPathname = request.pathname === '' ? '/' : request.pathname
  const explicitLocaleQuery = request.explicitLocaleQuery
  const requestSearchParams = sanitizeRouteSearchParams(request.searchParams)
  const requestUrl = buildUrl(rawPathname, requestSearchParams)
  const segments = normalizedPath.split('/').filter(Boolean)

  let prefixedLocale: string | undefined
  if (segments.length > 0) {
    if (prefixToLocale) {
      prefixedLocale = prefixToLocale[segments[0]]
    } else {
      const firstSeg = segments[0]
      for (const locale in localeConfig.locales) {
        if (localeConfig.locales[locale].urlPrefix === firstSeg) {
          prefixedLocale = locale
          break
        }
      }
    }
  }

  const currentLocale = prefixedLocale ?? detectedLocale ?? localeConfig.defaultLocale
  return {
    explicitLocaleQuery,
    rawPathname,
    requestPath,
    requestSearchParams,
    requestUrl,
    prefixedLocale,
    currentLocale,
    defaultLocaleAccessedViaPrefix: !localeConfig.prefixDefaultLocale && prefixedLocale === localeConfig.defaultLocale,
    defaultLocaleAccessedViaQuery: !localeConfig.prefixDefaultLocale && explicitLocaleQuery === localeConfig.defaultLocale,
    localizedRequestUrl: prefixedLocale
      ? normalizePathname(`/${segments.slice(1).join('/')}`)
      : requestPath,
  }
}

type RouteResolveContext = {
  i18n: I18nConfig
  compiled: CompiledDomainRouting
  resolved: ResolvedDomainConfig
  routeIndex: RouteIndex
  localeConfig: I18nRoute['localeConfig']
  domainConfig: I18nRoute['domainConfig']
  requestState: ResolvedRequestState
  paramVariants: ParamVariants
  queryVariants: QueryVariants
  trailingSlash: TrailingSlash
  trailingSlashRedirect: number | false
  currentLocale: LocaleCode
  routePattern?: string
  localizedPatterns?: Record<string, string>
  params: Record<string, string>
  variantRedirectPath?: string
  canonicalMatch: ReturnType<typeof findCanonicalRouteMatch> | null
  localizedMatch: ReturnType<typeof findLocalizedRouteMatch> | null
}

type ResolvedRouteUrlState = {
  canonicalSearchParams: URLSearchParams
  canonicalPath: string
  currentLocalePath: string
  defaultLocalePath: string
  currentLocaleSearchParams: URLSearchParams
  defaultLocaleSearchParams: URLSearchParams
  currentLocaleUrl: string
  defaultLocaleUrl: string
  logicalUrl: string
  alternateUrls: AlternateUrl[]
}

type ResolvedRouteRedirectState = {
  redirectTo?: string
  redirectStatus?: RedirectStatusCode
}

type RouteResolveOverrides = {
  currentRoute?: I18nRoute
  paramVariants?: ParamVariants
  queryVariants?: QueryVariants
}

function createFlatI18nRoute(route: Omit<I18nRoute, 'locales' | 'localeMeta' | 'localesConfig'>): I18nRoute {
  return {
    ...route,
    locales: Object.keys(route.localeConfig.locales),
    localeMeta: route.localeConfig.currentLocaleMeta,
    localesConfig: Object.entries(route.localeConfig.locales).map(([locale, config]) => ({
      locale,
      ...config,
    })),
  }
}

export function syncI18nRoute(
  target: I18nRoute,
  next: I18nRoute,
): I18nRoute {
  Object.assign(target, next)
  return target
}

function createRouteResolveContext(
  pathname: string,
  pageContext: I18nPageContext,
  overrides: RouteResolveOverrides = {},
): RouteResolveContext {
  const i18n = getI18nConfig(pageContext)
  const currentRoute = overrides.currentRoute
  const pageRoute = (pageContext as Partial<{ i18nRoute: I18nRoute }>).i18nRoute
  const paramVariants = overrides.paramVariants
    ?? new Map(Object.entries(pageRoute?.paramVariants ?? {}))
  const queryVariants = overrides.queryVariants
    ?? new Map(Object.entries(pageRoute?.queryVariants ?? {}))

  if (currentRoute) {
    const compiled = getCompiledDomainRouting(i18n, currentRoute.domainConfig.domain)
    const resolved = resolveDomainConfigForDomain(i18n, currentRoute.domainConfig.domain)
    const requestState = resolveRequestState(
      parsePathAndQuery(pathname),
      currentRoute.localeConfig,
      currentRoute.locale,
    )
    const routePattern = currentRoute.routeKey
    const localizedPatterns = routePattern ? compiled.routeIndex.routes[routePattern] : undefined
    const knownMatch = routePattern && localizedPatterns
      ? resolveKnownRouteMatch(
          routePattern,
          localizedPatterns,
          paramVariants,
          requestState.localizedRequestUrl,
          currentRoute.localeConfig,
          requestState.currentLocale,
        )
      : null

    return {
      i18n,
      compiled,
      resolved,
      routeIndex: compiled.routeIndex,
      localeConfig: currentRoute.localeConfig,
      domainConfig: currentRoute.domainConfig,
      requestState,
      paramVariants,
      queryVariants,
      trailingSlash: resolved.trailingSlash,
      trailingSlashRedirect: resolved.trailingSlashRedirect,
      currentLocale: requestState.currentLocale,
      routePattern,
      localizedPatterns,
      params: knownMatch?.params ?? {},
      variantRedirectPath: routePattern && localizedPatterns && knownMatch?.matchedLocalized
        ? getVariantRedirectPath(
            paramVariants,
            routePattern,
            localizedPatterns,
            requestState.localizedRequestUrl,
            requestState.currentLocale,
            currentRoute.localeConfig,
          )
        : undefined,
      canonicalMatch: null,
      localizedMatch: null,
    }
  }

  const { requestLocale, localeConfig, domainConfig, compiled } = resolveConfigs(pageContext, i18n)
  const requestState = resolveRequestState(
    parsePathAndQuery(pathname),
    localeConfig,
    requestLocale,
    compiled.prefixToLocale,
  )
  const localizedMatch = findLocalizedRouteMatch(
    compiled.routeIndex,
    paramVariants,
    requestState.localizedRequestUrl,
    localeConfig,
    requestState.currentLocale,
  )
  const canonicalMatch = localizedMatch
    ?? findCanonicalRouteMatch(compiled.routeIndex, paramVariants, requestState.localizedRequestUrl, localeConfig)
  const routePattern = canonicalMatch?.canonicalPattern

  return {
    i18n,
    compiled,
    resolved: compiled.resolved,
    routeIndex: compiled.routeIndex,
    localeConfig,
    domainConfig,
    requestState,
    paramVariants,
    queryVariants,
    trailingSlash: compiled.resolved.trailingSlash,
    trailingSlashRedirect: compiled.resolved.trailingSlashRedirect,
    currentLocale: requestState.currentLocale,
    routePattern,
    localizedPatterns: canonicalMatch?.localizedPatterns,
    params: canonicalMatch?.params ?? {},
    variantRedirectPath: localizedMatch
      ? getVariantRedirectPath(
          paramVariants,
          localizedMatch.canonicalPattern,
          localizedMatch.localizedPatterns,
          requestState.localizedRequestUrl,
          requestState.currentLocale,
          localeConfig,
        )
      : undefined,
    canonicalMatch,
    localizedMatch,
  }
}

function resolveRouteUrlState(context: RouteResolveContext): ResolvedRouteUrlState {
  const { routeIndex, localeConfig, requestState, routePattern, localizedPatterns, params, paramVariants, queryVariants, trailingSlash } = context
  const canonicalSearchParams = canonicalizeQueryParams(queryVariants, requestState.requestSearchParams, localeConfig)
  const canonicalPath = routePattern
    ? buildConcretePath(paramVariants, routePattern, params, localeConfig)
    : requestState.localizedRequestUrl
  const currentLocalePath = buildLocalizedPathForRoute(
    routePattern,
    localizedPatterns,
    params,
    paramVariants,
    localeConfig,
    requestState.currentLocale,
    requestState.localizedRequestUrl,
  )
  const defaultLocalePath = buildLocalizedPathForRoute(
    routePattern,
    localizedPatterns,
    params,
    paramVariants,
    localeConfig,
    localeConfig.defaultLocale,
    requestState.localizedRequestUrl,
  )
  const currentLocaleSearchParams = localizeQueryParams(queryVariants, canonicalSearchParams, localeConfig, requestState.currentLocale)
  const defaultLocaleSearchParams = localizeQueryParams(queryVariants, canonicalSearchParams, localeConfig, localeConfig.defaultLocale)
  const currentLocaleUrl = buildLocalizedUrl(
    currentLocalePath,
    currentLocaleSearchParams,
    requestState.currentLocale,
    localeConfig,
    trailingSlash,
  )
  const defaultLocaleUrl = buildLocalizedUrl(
    defaultLocalePath,
    defaultLocaleSearchParams,
    localeConfig.defaultLocale,
    localeConfig,
    trailingSlash,
  )
  const logicalUrl = buildUrl(canonicalPath, canonicalSearchParams)

  return {
    canonicalSearchParams,
    canonicalPath,
    currentLocalePath,
    defaultLocalePath,
    currentLocaleSearchParams,
    defaultLocaleSearchParams,
    currentLocaleUrl,
    defaultLocaleUrl,
    logicalUrl,
    alternateUrls: buildAlternateUrls(routeIndex, paramVariants, logicalUrl, queryVariants, localeConfig, trailingSlash),
  }
}

function resolveRouteRedirectState(
  context: RouteResolveContext,
  urlState: ResolvedRouteUrlState,
): ResolvedRouteRedirectState {
  const { requestState, localeConfig, trailingSlash, trailingSlashRedirect, variantRedirectPath } = context
  const queryRedirect = requestState.requestSearchParams.toString() !== urlState.currentLocaleSearchParams.toString()
  const normalizedRedirect = variantRedirectPath || queryRedirect
    ? buildLocalizedUrl(
        variantRedirectPath ?? urlState.currentLocalePath,
        urlState.currentLocaleSearchParams,
        requestState.currentLocale,
        localeConfig,
        trailingSlash,
      )
    : requestState.requestUrl !== urlState.currentLocaleUrl
      ? urlState.currentLocaleUrl
      : undefined
  const onlyTrailingSlashDiff = (url: string) =>
    url.replace(/\/$/, '') === urlState.currentLocaleUrl.replace(/\/$/, '')
  const suppressTrailingSlashRedirect = (target: string) =>
    onlyTrailingSlashDiff(requestState.requestUrl)
    && onlyTrailingSlashDiff(target)
    && (trailingSlash === 'preserve' || trailingSlashRedirect === false)
  const rawRedirectTo = requestState.defaultLocaleAccessedViaPrefix
    ? normalizedRedirect
      ? buildSetLocaleRedirect(normalizedRedirect, localeConfig.defaultLocale)
      : buildSetLocaleRedirect(urlState.currentLocaleUrl, localeConfig.defaultLocale)
    : requestState.defaultLocaleAccessedViaQuery
      ? normalizedRedirect
        ? buildSetLocaleRedirect(normalizedRedirect, localeConfig.defaultLocale)
        : undefined
    : normalizedRedirect
      ? normalizedRedirect
    : requestState.requestUrl !== urlState.currentLocaleUrl
      ? urlState.currentLocaleUrl
      : undefined
  const redirectTo = rawRedirectTo && suppressTrailingSlashRedirect(rawRedirectTo)
    ? undefined
    : rawRedirectTo
  const trailingSlashMismatch = redirectTo !== undefined
    && trailingSlash !== 'preserve'
    && trailingSlashRedirect !== false
    && requestState.rawPathname !== '/'
    && (
      (trailingSlash === 'never' && requestState.rawPathname.endsWith('/'))
      || (trailingSlash === 'always' && !requestState.rawPathname.endsWith('/'))
    )
  const redirectStatus: RedirectStatusCode | undefined = redirectTo
    ? (trailingSlashMismatch ? trailingSlashRedirect as RedirectStatusCode : 302)
    : undefined

  return { redirectTo, redirectStatus }
}

function finalizeResolvedRoute(
  context: RouteResolveContext,
  urlState: ResolvedRouteUrlState,
  redirectState: ResolvedRouteRedirectState,
): I18nRoute {
  const { localeConfig, domainConfig, requestState, routePattern, params, paramVariants, queryVariants } = context
  const resolvedLocaleConfig: I18nRoute['localeConfig'] = {
    ...localeConfig,
    currentLocale: requestState.currentLocale,
    currentLocaleMeta: localeConfig.locales[requestState.currentLocale]?.meta,
  }

  return createFlatI18nRoute({
    locale: resolvedLocaleConfig.currentLocale,
    params,
    logicalUrl: urlState.logicalUrl,
    routeKey: routePattern,
    requestUrl: requestState.requestUrl,
    defaultLocaleUrl: urlState.defaultLocaleUrl,
    currentLocaleUrl: urlState.currentLocaleUrl,
    alternateUrls: urlState.alternateUrls,
    redirectTo: redirectState.redirectTo,
    redirectStatus: redirectState.redirectStatus,
    renderTo: undefined,
    aliasFrom: undefined,
    paramVariants: serializeParamVariants(paramVariants),
    queryVariants: serializeQueryVariants(queryVariants),
    localeConfig: resolvedLocaleConfig,
    domainConfig,
  })
}

function buildResolvedRoute(context: RouteResolveContext): I18nRoute {
  const urlState = resolveRouteUrlState(context)
  const redirectState = resolveRouteRedirectState(context, urlState)
  return finalizeResolvedRoute(context, urlState, redirectState)
}

function buildRedirectRoute(
  context: RouteResolveContext,
  targetUrl: string,
  logicalUrl: string,
  status: RedirectStatusCode,
): I18nRoute {
  const localeConfig: I18nRoute['localeConfig'] = {
    ...context.localeConfig,
    currentLocale: context.currentLocale,
    currentLocaleMeta: context.localeConfig.locales[context.currentLocale]?.meta,
  }

  return createFlatI18nRoute({
    locale: localeConfig.currentLocale,
    params: {},
    logicalUrl,
    routeKey: undefined,
    requestUrl: context.requestState.requestUrl,
    defaultLocaleUrl: targetUrl,
    currentLocaleUrl: targetUrl,
    alternateUrls: [],
    redirectTo: targetUrl,
    redirectStatus: status,
    renderTo: undefined,
    aliasFrom: undefined,
    paramVariants: serializeParamVariants(context.paramVariants),
    queryVariants: serializeQueryVariants(context.queryVariants),
    localeConfig,
    domainConfig: context.domainConfig,
  })
}

export function createI18nRouter(
  pathname: string,
  pageContext: I18nPageContext,
  paramVariants: ParamVariants = new Map(),
  queryVariants: QueryVariants = new Map(),
): I18nRoute {
  const context = createRouteResolveContext(pathname, pageContext, { paramVariants, queryVariants })

  if (context.compiled.redirects) {
    const configRedirectTarget = resolveConfigRedirect(
      context.compiled.redirects,
      context.requestState.localizedRequestUrl,
      context.currentLocale,
      context.routeIndex.routes,
      context.localeConfig,
    )

    if (configRedirectTarget !== null) {
      const configRedirectUrl = buildUrl(
        localizeCanonicalPath({
          index: context.routeIndex,
          paramVariants: context.paramVariants,
          canonicalPath: configRedirectTarget.url,
          queryVariants: context.queryVariants,
          locale: context.currentLocale,
          localeConfig: context.localeConfig,
          trailingSlash: context.trailingSlash,
        }),
        localizeQueryParams(
          context.queryVariants,
          canonicalizeQueryParams(context.queryVariants, context.requestState.requestSearchParams, context.localeConfig),
          context.localeConfig,
          context.currentLocale,
        ),
      )

      return buildRedirectRoute(context, configRedirectUrl, context.requestState.requestUrl, configRedirectTarget.status)
    }
  }

  if (!context.canonicalMatch && context.resolved.aliases && context.compiled.aliasIndex) {
    const aliasMatch = resolveAlias(
      context.compiled.aliasIndex,
      context.resolved.aliases,
      context.requestState.localizedRequestUrl,
      context.currentLocale,
      context.localeConfig,
      context.routeIndex.routes,
    )

    if (aliasMatch) {
      const targetRoute = buildResolvedRoute({
        ...context,
        routePattern: aliasMatch.targetRouteKey,
        localizedPatterns: context.routeIndex.routes[aliasMatch.targetRouteKey],
        params: aliasMatch.params,
        variantRedirectPath: undefined,
      })
      const alternateUrls = aliasMatch.localizedPatterns
        ? buildAliasAlternateUrls(
            aliasMatch.localizedPatterns,
            aliasMatch.params,
            context.localeConfig,
            (path, locale) => applyLocalePrefix(path, locale, context.localeConfig, undefined, context.trailingSlash),
          )
        : targetRoute.alternateUrls

      return createFlatI18nRoute({
        ...targetRoute,
        redirectTo: undefined,
        redirectStatus: undefined,
        aliasFrom: aliasMatch.aliasKey,
        alternateUrls,
      })
    }
  }

  return buildResolvedRoute(context)
}
