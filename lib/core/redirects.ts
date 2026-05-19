import { buildRoutePath, matchRoutePattern, normalizePathname } from './route-patterns'
import type {
  FlatI18nRoutes,
  LocaleCode,
  PageContextLocaleConfig,
  RedirectConfig,
  RedirectStatusCode,
} from './types'

type ResolvedConfigRedirect = {
  url: string
  status: RedirectStatusCode
}

// Finds the localized variant of a source pattern for the given locale.
//
// Two cases:
// 1. sourcePattern is an exact route key (e.g. '/specialities/:speciality') — use its locale variant directly.
// 2. sourcePattern matches a canonical route pattern (e.g. '/specialities/diver' matches '/specialities/:speciality')
//    — build the localized variant of that canonical pattern with the same params, giving
//    the locale-specific equivalent of the source (e.g. '/specialnosti/diver' for 'ru').
//
// Returns null if no matching route is found (source stays as-is).
function getLocaleAwareSourcePattern(
  sourcePattern: string,
  currentLocale: LocaleCode,
  routes: FlatI18nRoutes,
): string | null {
  // Case 1: direct route key match
  const directEntry = routes[sourcePattern]
  if (directEntry?.[currentLocale]) {
    return directEntry[currentLocale]
  }

  // Case 2: sourcePattern is a concrete path that matches a canonical route pattern
  const normalized = normalizePathname(sourcePattern)
  for (const [canonicalPattern, localizedPatterns] of Object.entries(routes)) {
    const localePattern = localizedPatterns[currentLocale] ?? canonicalPattern
    if (localePattern === canonicalPattern) continue  // no localized variant, skip

    const params = matchRoutePattern(canonicalPattern, normalized)
    if (!params) continue

    // Build the localized equivalent of the source concrete path
    return buildRoutePath(localePattern, params)
  }

  return null
}

// Resolves a config-defined redirect for the given bare (prefix-stripped) request URL.
//
// For each redirect entry, tries to match `localizedRequestUrl` against:
// 1. The locale-aware version of the source pattern (covers localized route variants automatically).
// 2. The literal source pattern as fallback.
//
// Returns the canonical target path (without locale prefix) if a redirect applies, or null.
// The caller is responsible for localizing and prefixing the returned path.
export function resolveConfigRedirect(
  redirects: RedirectConfig,
  localizedRequestUrl: string,
  currentLocale: LocaleCode,
  routes: FlatI18nRoutes,
  localeConfig: PageContextLocaleConfig,
): ResolvedConfigRedirect | null {
  const normalizedRequest = normalizePathname(localizedRequestUrl)

  for (const [sourcePattern, target] of Object.entries(redirects)) {
    const targetUrl = typeof target === 'string' ? target : target.url
    const allowedLocales = typeof target === 'object' ? target.locales : undefined
    const status = typeof target === 'object' ? (target.status ?? 302) : 302

    // Check locale scope restriction
    if (allowedLocales?.length && !allowedLocales.includes(currentLocale)) continue

    // Try locale-aware source pattern (covers localized route variants)
    const localeAwareSource = getLocaleAwareSourcePattern(sourcePattern, currentLocale, routes)
    let params = localeAwareSource ? matchRoutePattern(localeAwareSource, normalizedRequest) : null

    // Fall back to literal source pattern
    if (!params) {
      params = matchRoutePattern(sourcePattern, normalizedRequest)
    }

    if (!params) continue

    // Build target path, filling in matched params.
    // Named wildcard params not referenced in targetUrl are silently dropped by buildRoutePath.
    const builtTarget = buildRoutePath(targetUrl, params)
    const normalizedTarget = normalizePathname(builtTarget)

    // Skip self-redirects
    if (normalizedTarget === normalizedRequest) continue

    return {
      url: normalizedTarget,
      status,
    }
  }

  return null
}
