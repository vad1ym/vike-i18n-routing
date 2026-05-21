import { buildRoutePath, matchRoutePattern, normalizePathname } from './route-patterns'
import type {
  AliasConfig,
  AliasValue,
  LocalizedAliasValue,
  FlatI18nRoutes,
  LocaleCode,
  PageContextLocaleConfig,
} from './types'

function isLocalizedAlias(value: AliasValue): value is LocalizedAliasValue {
  return typeof value === 'object'
}

export type ResolvedAlias = {
  // Alias config key that matched the request (e.g. '/company')
  aliasKey: string
  // The canonical route key this alias resolves to (e.g. '/about')
  targetRouteKey: string
  // Params extracted from the alias pattern (e.g. { country: 'spain' })
  params: Record<string, string>
  // Localized patterns for this alias (when localized alias object was used)
  localizedPatterns?: LocalizedAliasValue
}

// Builds a flat lookup of normalized alias source patterns → alias values.
// Used for fast exact/dynamic matching.
export type AliasIndex = {
  static: Map<string, { aliasKey: string; value: AliasValue }>
  dynamic: Array<{ aliasKey: string; value: AliasValue }>
}

export function buildAliasIndex(aliases: AliasConfig): AliasIndex {
  const staticMap = new Map<string, { aliasKey: string; value: AliasValue }>()
  const dynamic: Array<{ aliasKey: string; value: AliasValue }> = []

  for (const [aliasKey, value] of Object.entries(aliases)) {
    const isDynamic = aliasKey.includes(':') || aliasKey.includes('@') || aliasKey.includes('{')
    if (isDynamic) {
      dynamic.push({ aliasKey, value })
    } else {
      const normalized = normalizePathname(aliasKey)
      staticMap.set(normalized, { aliasKey, value })

      // For localized aliases, also index all locale-specific paths
      if (isLocalizedAlias(value)) {
        for (const [key, localePath] of Object.entries(value)) {
          if (key === 'target') continue
          const normalizedLocale = normalizePathname(localePath)
          if (!staticMap.has(normalizedLocale)) {
            staticMap.set(normalizedLocale, { aliasKey, value })
          }
        }
      }
    }
  }

  return { static: staticMap, dynamic }
}

// Resolves the concrete target path and best-matching route key for an alias value + params.
// Both string aliases and localized alias `target` fields are treated as path templates:
// params are filled in first, then the resulting path is matched against known routes.
// Returns null if no route can be found.
function resolveAliasTarget(
  value: AliasValue,
  params: Record<string, string | undefined>,
  routes: FlatI18nRoutes,
): { targetRouteKey: string; mergedParams: Record<string, string>; normalizedTarget: string } | null {
  const template = typeof value === 'string' ? value : value.target
  const normalizedTarget = normalizePathname(buildRoutePath(template, params))

  // Exact route key match
  if (routes[normalizedTarget]) {
    return { targetRouteKey: normalizedTarget, mergedParams: params as Record<string, string>, normalizedTarget }
  }

  // Pattern match — find the most specific route whose pattern matches the concrete target path
  let bestRouteKey: string | null = null
  let bestScore = -1
  let bestMerged: Record<string, string> | null = null

  for (const routeKey of Object.keys(routes)) {
    const normalizedKey = normalizePathname(routeKey)
    const routeParams = matchRoutePattern(normalizedKey, normalizedTarget)
    if (routeParams) {
      const score = normalizedKey.length
      if (score > bestScore) {
        bestScore = score
        bestRouteKey = routeKey
        bestMerged = { ...params, ...routeParams } as Record<string, string>
      }
    }
  }

  if (bestRouteKey && bestMerged) {
    return { targetRouteKey: bestRouteKey, mergedParams: bestMerged, normalizedTarget }
  }

  return null
}

// Tries to match a request pathname against all alias patterns.
// Returns the resolved alias (target route key + params) or null.
// depth guards against circular alias chains.
export function resolveAlias(
  index: AliasIndex,
  aliases: AliasConfig,
  pathname: string,
  currentLocale: LocaleCode,
  localeConfig: PageContextLocaleConfig,
  routes: FlatI18nRoutes,
  depth = 0,
): ResolvedAlias | null {
  if (depth > 10) return null

  const normalizedPathname = normalizePathname(pathname)

  // 1. Check static aliases
  const staticEntry = index.static.get(normalizedPathname)
  if (staticEntry) {
    const resolved = resolveAliasTarget(staticEntry.value, {}, routes)
    if (!resolved) {
      const chained = resolveAlias(index, aliases, normalizePathname(typeof staticEntry.value === 'string' ? staticEntry.value : staticEntry.value.target), currentLocale, localeConfig, routes, depth + 1)
      if (chained) {
        return {
          ...chained,
          aliasKey: staticEntry.aliasKey,
          localizedPatterns: isLocalizedAlias(staticEntry.value) ? staticEntry.value : undefined,
        }
      }
      return null
    }
    return {
      aliasKey: staticEntry.aliasKey,
      targetRouteKey: resolved.targetRouteKey,
      params: resolved.mergedParams,
      localizedPatterns: isLocalizedAlias(staticEntry.value) ? staticEntry.value : undefined,
    }
  }

  // 2. Try dynamic localized alias patterns for current locale
  for (const [_aliasKey, value] of Object.entries(aliases)) {
    if (!isLocalizedAlias(value)) continue

    const localePattern = value[currentLocale]
    if (!localePattern || !(localePattern.includes(':') || localePattern.includes('{'))) continue

    const params = matchRoutePattern(localePattern, normalizedPathname)
    if (!params) continue

    const resolved = resolveAliasTarget(value, params as Record<string, string>, routes)
    if (resolved) {
      return {
        aliasKey: _aliasKey,
        targetRouteKey: resolved.targetRouteKey,
        params: resolved.mergedParams,
        localizedPatterns: value,
      }
    }
    // Target path didn't match a route — try chaining
    const chained = resolveAlias(index, aliases, normalizePathname(buildRoutePath(value.target, params)), currentLocale, localeConfig, routes, depth + 1)
    if (chained) {
      return {
        ...chained,
        aliasKey: _aliasKey,
        params: { ...params, ...chained.params } as Record<string, string>,
        localizedPatterns: value,
      }
    }
  }

  // 3. Check dynamic aliases (parametric)
  for (const { aliasKey, value } of index.dynamic) {
    const params = matchRoutePattern(aliasKey, normalizedPathname)
    if (!params) continue

    const resolved = resolveAliasTarget(value, params as Record<string, string>, routes)
    if (resolved) {
      return {
        aliasKey,
        targetRouteKey: resolved.targetRouteKey,
        params: resolved.mergedParams,
        localizedPatterns: isLocalizedAlias(value) ? value : undefined,
      }
    }

    // No route matched — try chaining through another alias
    const template = typeof value === 'string' ? value : value.target
    const chained = resolveAlias(index, aliases, normalizePathname(buildRoutePath(template, params)), currentLocale, localeConfig, routes, depth + 1)
    if (chained) {
      return {
        ...chained,
        aliasKey,
        params: { ...params, ...chained.params } as Record<string, string>,
        localizedPatterns: isLocalizedAlias(value) ? value : chained.localizedPatterns,
      }
    }
  }

  return null
}

// Builds alternate URLs for a localized alias.
// When the alias has its own localized paths, those are used for hreflang instead of the target's.
export function buildAliasAlternateUrls(
  localizedPatterns: LocalizedAliasValue,
  params: Record<string, string>,
  localeConfig: PageContextLocaleConfig,
  applyPrefix: (path: string, locale: LocaleCode) => string,
): Array<{ locale: LocaleCode; url: string }> {
  return Object.keys(localeConfig.locales).map((locale) => {
    const pattern = locale !== 'target' ? localizedPatterns[locale] : undefined
    const path = pattern ? normalizePathname(buildRoutePath(pattern, params)) : '/'
    return { locale, url: applyPrefix(path, locale) }
  })
}
