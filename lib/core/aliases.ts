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

// Resolves the target route key from an alias value.
// For a simple string alias, the value IS the route key.
// For a localized alias object, the explicit `target` field identifies the route key.
function resolveAliasTargetKey(
  value: AliasValue,
  routes: FlatI18nRoutes,
): string | null {
  if (typeof value === 'string') {
    // Simple alias — value is directly the route key
    const normalized = normalizePathname(value)
    return routes[normalized] ? normalized : normalized
  }

  // Localized alias — use explicit target field
  const target = normalizePathname(value.target)
  return target
}

// Tries to match a request pathname against all alias patterns.
// Returns the resolved alias (target route key + params) or null.
export function resolveAlias(
  index: AliasIndex,
  aliases: AliasConfig,
  pathname: string,
  currentLocale: LocaleCode,
  localeConfig: PageContextLocaleConfig,
  routes: FlatI18nRoutes,
): ResolvedAlias | null {
  const normalizedPathname = normalizePathname(pathname)

  // 1. Check static aliases
  const staticEntry = index.static.get(normalizedPathname)
  if (staticEntry) {
    const targetKey = resolveAliasTargetKey(staticEntry.value, routes)
    if (!targetKey) return null

    return {
      targetRouteKey: targetKey,
      params: {},
      localizedPatterns: isLocalizedAlias(staticEntry.value) ? staticEntry.value : undefined,
    }
  }

  // 2. Try dynamic localized alias patterns for current locale
  for (const [_aliasKey, value] of Object.entries(aliases)) {
    if (!isLocalizedAlias(value)) continue

    const localePattern = value[currentLocale]
    if (!localePattern || !(localePattern.includes(':') || localePattern.includes('{'))) continue

    const params = matchRoutePattern(localePattern, normalizedPathname)
    if (params) {
      const targetKey = resolveAliasTargetKey(value, routes)
      if (!targetKey) continue
      return {
        targetRouteKey: targetKey,
        params: params as Record<string, string>,
        localizedPatterns: value,
      }
    }
  }

  // 3. Check dynamic aliases (parametric)
  for (const { aliasKey, value } of index.dynamic) {
    if (typeof value !== 'string') continue  // localized dynamic aliases handled above

    const params = matchRoutePattern(aliasKey, normalizedPathname)
    if (!params) continue

    // Build the target path by filling in matched params
    const normalizedTarget = normalizePathname(buildRoutePath(value, params))

    // Find the route key that matches the resolved target
    // Target is treated as a prefix — find the most specific route key matching it
    let bestRouteKey: string | null = null
    let bestScore = -1

    for (const routeKey of Object.keys(routes)) {
      const normalizedKey = normalizePathname(routeKey)
      if (normalizedTarget === normalizedKey) {
        // Exact match
        bestRouteKey = routeKey
        break
      }
      // Prefix match — target '/medicines/ingredients/ibuprofen' matches route '/medicines/ingredients/:ingredient'
      const routeParams = matchRoutePattern(normalizedKey, normalizedTarget)
      if (routeParams) {
        const score = normalizedKey.length
        if (score > bestScore) {
          bestScore = score
          bestRouteKey = routeKey
          // Merge extracted alias params with route params
          const mergedParams = { ...params, ...routeParams } as Record<string, string>
          return {
            targetRouteKey: routeKey,
            params: mergedParams,
          }
        }
      }
    }

    if (bestRouteKey) {
      return {
        targetRouteKey: bestRouteKey,
        params: params as Record<string, string>,
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
