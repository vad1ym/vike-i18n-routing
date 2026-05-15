import { detectDomain, resolveDomainConfig } from './domain/normalize'
import { detectRequestLocale } from './locale/detector'
import { getI18nConfig } from './pageContext'
import { buildRoutePath, matchRoutePattern, normalizePathname } from './route-patterns'
import type {
  AlternateUrl,
  I18nConfig,
  I18nPageContext,
  I18nRoute,
  I18nRoutes,
  LocaleCode,
  LocalizedPathOptions,
  PageContextLocaleConfig,
  ParamVariantConfig,
  QueryVariantConfig,
  RouteConfig,
} from './types'

// Result of matching a URL against a route. Carries everything needed
// to build canonical and localized URLs for the matched route.
type RouteMatch = {
  canonicalPattern: string                  // e.g. '/services/:category'
  localizedPatterns: Record<string, string> // e.g. { ru: '/uslugi/:category' }
  canonicalPath: string                     // concrete canonical URL, e.g. '/services/web'
  matchedLocale: string                     // locale whose pattern matched
  params: Record<string, string>            // extracted and canonicalized params
}

type ParamVariants = Map<string, ParamVariantConfig>
type QueryVariants = Map<string, QueryVariantConfig>


// ────────────────────────────────────────────────────────────────
// Param variant helpers
//
// Param variants allow dynamic route params (like slugs) to have
// locale-specific values. For example, a "category" param might be
// "services" in English and "uslugi" in Russian.
//
// The system works by:
// 1. canonicalize: convert any locale-specific value → default locale value
// 2. localize: convert canonical value → target locale value
// ────────────────────────────────────────────────────────────────

// Returns the locale to use as the "canonical" source for a param's variant values.
// Prefers defaultLocale if it has a variant, otherwise falls back to the first defined locale.
function getDefaultVariantLocale(
  paramVariants: ParamVariants,
  paramName: string,
  localeConfig: PageContextLocaleConfig,
): string | undefined {
  const variants = paramVariants.get(paramName)?.variants
  if (!variants) return undefined

  return variants[localeConfig.defaultLocale]
    ? localeConfig.defaultLocale
    : Object.keys(variants)[0]
}

// Converts a locale-specific param value to its canonical (default locale) form.
// If rawValue matches any variant, returns the default variant. Otherwise returns rawValue as-is.
function canonicalizeParamValue(
  paramVariants: ParamVariants,
  paramName: string,
  rawValue: string,
  localeConfig: PageContextLocaleConfig,
): string {
  const variants = paramVariants.get(paramName)?.variants
  if (!variants) return rawValue

  const defaultVariantLocale = getDefaultVariantLocale(paramVariants, paramName, localeConfig)
  const defaultValue = defaultVariantLocale ? variants[defaultVariantLocale] : undefined

  for (const variant of Object.values(variants)) {
    if (variant === rawValue) return defaultValue ?? rawValue
  }

  return rawValue
}

// Converts a canonical param value to its locale-specific form.
// If the canonical value matches the default variant, returns the target locale's variant.
function localizeParamValue(
  paramVariants: ParamVariants,
  paramName: string,
  canonicalValue: string,
  localeConfig: PageContextLocaleConfig,
  locale = localeConfig.defaultLocale,
): string {
  const variants = paramVariants.get(paramName)?.variants
  if (!variants) return canonicalValue

  const defaultVariantLocale = getDefaultVariantLocale(paramVariants, paramName, localeConfig)
  const defaultValue = defaultVariantLocale ? variants[defaultVariantLocale] : undefined

  if (defaultValue === canonicalValue && variants[locale]) {
    return variants[locale]
  }

  for (const variant of Object.values(variants)) {
    if (variant === canonicalValue) {
      return variants[locale] ?? canonicalValue
    }
  }

  return variants[locale] && locale === localeConfig.defaultLocale && defaultValue === undefined
    ? variants[locale]
    : canonicalValue
}

function getDefaultQueryVariantLocale(
  queryVariants: QueryVariants,
  queryName: string,
  localeConfig: PageContextLocaleConfig,
): string | undefined {
  const variants = queryVariants.get(queryName)?.variants
  if (!variants) return undefined

  return variants[localeConfig.defaultLocale]
    ? localeConfig.defaultLocale
    : Object.keys(variants)[0]
}

function canonicalizeQueryValue(
  queryVariants: QueryVariants,
  queryName: string,
  rawValue: string,
  localeConfig: PageContextLocaleConfig,
): string {
  const variants = queryVariants.get(queryName)?.variants
  if (!variants) return rawValue

  const defaultVariantLocale = getDefaultQueryVariantLocale(queryVariants, queryName, localeConfig)
  const defaultValue = defaultVariantLocale ? variants[defaultVariantLocale] : undefined

  for (const variant of Object.values(variants)) {
    if (variant === rawValue) return defaultValue ?? rawValue
  }

  return rawValue
}

function localizeQueryValue(
  queryVariants: QueryVariants,
  queryName: string,
  canonicalValue: string,
  localeConfig: PageContextLocaleConfig,
  locale = localeConfig.defaultLocale,
): string {
  const variants = queryVariants.get(queryName)?.variants
  if (!variants) return canonicalValue

  const defaultVariantLocale = getDefaultQueryVariantLocale(queryVariants, queryName, localeConfig)
  const defaultValue = defaultVariantLocale ? variants[defaultVariantLocale] : undefined

  if (defaultValue === canonicalValue) {
    return variants[locale] ?? canonicalValue
  }

  for (const variant of Object.values(variants)) {
    if (variant === canonicalValue) {
      return variants[locale] ?? canonicalValue
    }
  }

  return canonicalValue
}

function sanitizeRouteSearchParams(searchParams: URLSearchParams): URLSearchParams {
  const sanitized = new URLSearchParams(searchParams)
  sanitized.delete('locale')
  sanitized.delete('lang')
  return sanitized
}

function canonicalizeQueryParams(
  queryVariants: QueryVariants,
  searchParams: URLSearchParams,
  localeConfig: PageContextLocaleConfig,
): URLSearchParams {
  const canonical = new URLSearchParams()

  for (const [name, value] of sanitizeRouteSearchParams(searchParams).entries()) {
    canonical.append(name, canonicalizeQueryValue(queryVariants, name, value, localeConfig))
  }

  return canonical
}

function localizeQueryParams(
  queryVariants: QueryVariants,
  searchParams: URLSearchParams,
  localeConfig: PageContextLocaleConfig,
  locale = localeConfig.defaultLocale,
): URLSearchParams {
  const localized = new URLSearchParams()

  for (const [name, value] of searchParams.entries()) {
    localized.append(name, localizeQueryValue(queryVariants, name, value, localeConfig, locale))
  }

  return localized
}

function buildUrl(pathname: string, searchParams: URLSearchParams): string {
  const search = searchParams.toString()
  return search ? `${pathname}?${search}` : pathname
}

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
  const localizedParams = Object.fromEntries(
    Object.entries(params).map(([name, value]) => [
      name,
      value ? localizeParamValue(paramVariants, name, value, localeConfig, locale) : value,
    ]),
  )

  return buildRoutePath(pattern, localizedParams)
}

// Matches a pathname against a pattern, then canonicalizes all extracted param values.
// Returns null if the pattern doesn't match.
function matchConcretePath(
  paramVariants: ParamVariants,
  pattern: string,
  pathname: string,
  localeConfig: PageContextLocaleConfig,
): Record<string, string> | null {
  const params = matchRoutePattern(pattern, pathname)
  if (!params) return null

  return Object.fromEntries(
    Object.entries(params).map(([name, value]) => [
      name,
      value ? canonicalizeParamValue(paramVariants, name, value, localeConfig) : '',
    ]),
  )
}

// Returns the localized pattern for a locale, falling back to the canonical pattern.
function getLocalizedPattern(
  localizedPatterns: Record<string, string>,
  canonicalPattern: string,
  locale: string,
): string {
  return localizedPatterns[locale] ?? canonicalPattern
}

// ────────────────────────────────────────────────────────────────
// Route matching
//
// Two strategies:
// - findLocalizedRouteMatch: tries all locale-specific patterns (preferred locale first)
// - findCanonicalRouteMatch: tries only canonical (key) patterns
//
// The resolve flow tries localized first, then falls back to canonical.
// This handles both "/o-nas" (localized) and "/about" (canonical) inputs.
// ────────────────────────────────────────────────────────────────

// Tries to match pathname against every route's localized patterns.
// Iterates routes × locales, preferring preferredLocale to resolve ambiguity
// when the same path could match multiple locales.
function findLocalizedRouteMatch(
  routes: I18nRoutes,
  paramVariants: ParamVariants,
  pathname: string,
  localeConfig: PageContextLocaleConfig,
  preferredLocale?: string,
): RouteMatch | null {
  const normalizedPathname = normalizePathname(pathname)
  const locales = Object.keys(localeConfig.locales)
  const orderedLocales = preferredLocale
    ? [preferredLocale, ...locales.filter((l) => l !== preferredLocale)]
    : locales

  for (const [canonicalPattern, localizedPatterns] of Object.entries(routes)) {
    for (const locale of orderedLocales) {
      const pattern = getLocalizedPattern(localizedPatterns, canonicalPattern, locale)
      const params = matchConcretePath(paramVariants, pattern, normalizedPathname, localeConfig)
      if (!params) continue

      return {
        canonicalPattern,
        localizedPatterns,
        params,
        matchedLocale: locale,
        canonicalPath: buildConcretePath(paramVariants, canonicalPattern, params, localeConfig),
      }
    }
  }

  return null
}

// Tries to match pathname against canonical patterns only (the route config keys).
// Used as a fallback when no localized pattern matches.
function findCanonicalRouteMatch(
  routes: I18nRoutes,
  paramVariants: ParamVariants,
  pathname: string,
  localeConfig: PageContextLocaleConfig,
): RouteMatch | null {
  const normalizedPathname = normalizePathname(pathname)

  for (const [canonicalPattern, localizedPatterns] of Object.entries(routes)) {
    const params = matchConcretePath(paramVariants, canonicalPattern, normalizedPathname, localeConfig)
    if (!params) continue

    return {
      canonicalPattern,
      localizedPatterns,
      params,
      matchedLocale: localeConfig.defaultLocale,
      canonicalPath: buildConcretePath(paramVariants, canonicalPattern, params, localeConfig),
    }
  }

  return null
}

// ────────────────────────────────────────────────────────────────
// Locale prefix
//
// Manages the locale segment in URLs (e.g. "/ru/o-nas").
// The default locale may or may not have a prefix depending on config.
// ────────────────────────────────────────────────────────────────

// Prepends locale prefix to a pathname based on config and options.
// Skips prefix for the default locale unless prefixDefaultLocale is set.
function applyLocalePrefix(
  pathname: string,
  locale: LocaleCode,
  localeConfig: PageContextLocaleConfig,
  options?: LocalizedPathOptions,
): string {
  const normalized = normalizePathname(pathname)
  const targetLocaleConfig = localeConfig.locales[locale]

  if (!targetLocaleConfig) {
    throw new Error(`[vike-i18n] Unknown locale: "${locale}"`)
  }

  if (options?.prefix === false || (options?.prefix === undefined && locale === localeConfig.defaultLocale && !localeConfig.prefixDefaultLocale)) {
    return normalized
  }

  const prefix = `/${targetLocaleConfig.urlPrefix}`
  return normalized === '/' ? prefix : `${prefix}${normalized}`
}

// Converts a canonical path (e.g. '/about') to a fully localized URL
// (e.g. '/ru/o-nas') by finding the route, building the localized path,
// and applying the locale prefix.
export function localizeCanonicalPath(
  routes: I18nRoutes,
  paramVariants: ParamVariants,
  canonicalPath: string,
  queryVariants: QueryVariants,
  locale: LocaleCode,
  localeConfig: PageContextLocaleConfig,
  options?: LocalizedPathOptions,
): string {
  const url = new URL(canonicalPath, 'http://localhost')
  const canonicalPathname = normalizePathname(url.pathname)
  const canonicalSearchParams = sanitizeRouteSearchParams(url.searchParams)
  const match = findCanonicalRouteMatch(routes, paramVariants, canonicalPathname, localeConfig)
  const localizedPath = match
    ? buildConcretePath(
        paramVariants,
        getLocalizedPattern(match.localizedPatterns, match.canonicalPattern, locale),
        match.params,
        localeConfig,
        locale,
      )
    : canonicalPathname

  return buildUrl(
    applyLocalePrefix(localizedPath, locale, localeConfig, options),
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

// ────────────────────────────────────────────────────────────────
// Config resolution
//
// Resolves the config objects that drive I18nRoute:
// - detected request locale/domain for internal routing decisions
// - localeConfig: available locales, default locale, prefix settings
// - domainConfig: domain-specific overrides (if multi-domain setup)
// ────────────────────────────────────────────────────────────────

function resolveConfigs(pageContext: I18nPageContext, i18n: I18nConfig) {
  const domain = detectDomain(pageContext, i18n)
  const ctxWithDomain = domain ? { ...pageContext, domain } : pageContext

  const requestLocale = detectRequestLocale(ctxWithDomain, i18n)

  const resolved = resolveDomainConfig(i18n, ctxWithDomain)

  const localeConfig: PageContextLocaleConfig = {
    defaultLocale: resolved.defaultLocale,
    locales: resolved.locales,
    currentLocale: requestLocale,
    prefixDefaultLocale: resolved.prefixDefaultLocale,
  }

  const domainConfig = resolved.domain
    ? {
        domain: resolved.domain,
        defaultLocale: resolved.defaultLocale,
        locales: resolved.locales,
        prefixDefaultLocale: resolved.prefixDefaultLocale,
        meta: resolved.meta,
      }
    : { domain: undefined as string | undefined }

  return { requestLocale, domainConfig, localeConfig, domain }
}

// ────────────────────────────────────────────────────────────────
// Alternate URLs
// ────────────────────────────────────────────────────────────────

// Builds an array of { locale, url } for all available locales.
// Used for hreflang tags and language switchers.
function buildAlternateUrls(
  routes: I18nRoutes,
  paramVariants: ParamVariants,
  canonicalPath: string,
  queryVariants: QueryVariants,
  localeConfig: PageContextLocaleConfig,
): AlternateUrl[] {
  return Object.keys(localeConfig.locales).map((locale) => ({
    locale,
    url: localizeCanonicalPath(routes, paramVariants, canonicalPath, queryVariants, locale, localeConfig),
  }))
}

function buildSetLocaleRedirect(
  pathname: string,
  locale: LocaleCode,
): string {
  const url = new URL(pathname, 'http://localhost')
  url.searchParams.set('locale', locale)
  return `${url.pathname}${url.search}`
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

export function createI18nRouter(
  pathname: string,
  pageContext: I18nPageContext,
  paramVariants: ParamVariants = new Map(),
  queryVariants: QueryVariants = new Map(),
): I18nRoute {
  const i18n = getI18nConfig(pageContext)
  const request = new URL(pathname, 'http://localhost')

  // Step 1: Resolve configs
  const { requestLocale, localeConfig, domainConfig } = resolveConfigs(pageContext, i18n)

  // Step 2: Extract locale from URL prefix
  const requestPath = normalizeRoutingPathname(request.pathname)
  const explicitLocaleQuery = request.searchParams.get('locale') ?? request.searchParams.get('lang')
  const requestSearchParams = sanitizeRouteSearchParams(request.searchParams)
  const requestUrl = buildUrl(requestPath, requestSearchParams)
  const segments = requestPath.split('/').filter(Boolean)
  const prefixedLocale = Object.entries(localeConfig.locales).find(
    ([, config]) => config.urlPrefix === segments[0],
  )?.[0]
  const currentLocale = prefixedLocale ?? requestLocale ?? localeConfig.defaultLocale
  const hasDefaultPrefixIntent = !localeConfig.prefixDefaultLocale
    && prefixedLocale === localeConfig.defaultLocale
  const hasDefaultQueryIntent = !localeConfig.prefixDefaultLocale
    && explicitLocaleQuery === localeConfig.defaultLocale
  const localizedRequestUrl = prefixedLocale
    ? normalizePathname(`/${segments.slice(1).join('/')}`)
    : requestPath

  // Step 3: Match route (localized first, then canonical fallback)
  const localizedMatch = findLocalizedRouteMatch(
    i18n.routes, paramVariants, localizedRequestUrl, localeConfig, currentLocale,
  )
  const canonicalMatch = localizedMatch
    ?? findCanonicalRouteMatch(i18n.routes, paramVariants, localizedRequestUrl, localeConfig)
  const canonicalPath = canonicalMatch?.canonicalPath ?? localizedRequestUrl
  const routePattern = canonicalMatch?.canonicalPattern ?? canonicalPath
  const params = canonicalMatch?.params ?? {}
  const canonicalSearchParams = canonicalizeQueryParams(queryVariants, requestSearchParams, localeConfig)

  // Step 4: Build all URL variants
  const currentLocalePath = canonicalMatch
    ? buildConcretePath(
        paramVariants,
        getLocalizedPattern(canonicalMatch.localizedPatterns, canonicalMatch.canonicalPattern, currentLocale),
        params, localeConfig, currentLocale,
      )
    : localizedRequestUrl
  const defaultLocalePath = canonicalMatch
    ? buildConcretePath(
        paramVariants,
        getLocalizedPattern(canonicalMatch.localizedPatterns, canonicalMatch.canonicalPattern, localeConfig.defaultLocale),
        params, localeConfig,
      )
    : localizedRequestUrl
  const currentLocaleSearchParams = localizeQueryParams(queryVariants, canonicalSearchParams, localeConfig, currentLocale)
  const defaultLocaleSearchParams = localizeQueryParams(queryVariants, canonicalSearchParams, localeConfig, localeConfig.defaultLocale)

  const currentLocaleUrl = buildUrl(
    applyLocalePrefix(currentLocalePath, currentLocale, localeConfig),
    currentLocaleSearchParams,
  )
  const defaultLocaleUrl = buildUrl(
    applyLocalePrefix(defaultLocalePath, localeConfig.defaultLocale, localeConfig),
    defaultLocaleSearchParams,
  )

  // Step 5: Determine redirect
  const variantRedirectPath = localizedMatch
    ? getVariantRedirectPath(
        paramVariants, localizedMatch.canonicalPattern, localizedMatch.localizedPatterns,
        localizedRequestUrl, currentLocale, localeConfig,
      )
    : undefined
  const queryRedirect = requestSearchParams.toString() !== currentLocaleSearchParams.toString()

  const normalizedRedirect = variantRedirectPath || queryRedirect
    ? buildUrl(
        applyLocalePrefix(variantRedirectPath ?? currentLocalePath, currentLocale, localeConfig),
        currentLocaleSearchParams,
      )
    : requestUrl !== currentLocaleUrl
      ? currentLocaleUrl
      : undefined

  const redirectTo = hasDefaultPrefixIntent
    ? normalizedRedirect
      ? buildSetLocaleRedirect(normalizedRedirect, localeConfig.defaultLocale)
      : buildSetLocaleRedirect(currentLocaleUrl, localeConfig.defaultLocale)
    : hasDefaultQueryIntent
      ? normalizedRedirect
        ? buildSetLocaleRedirect(normalizedRedirect, localeConfig.defaultLocale)
        : undefined
    : normalizedRedirect
      ? normalizedRedirect
    : requestUrl !== currentLocaleUrl
      ? currentLocaleUrl
      : undefined

  // Step 6: Assemble result
  const routeConfig: RouteConfig = {
    requestUrl,
    defaultLocaleUrl,
    currentLocaleUrl,
    redirectTo,
    canonicalUrl: buildUrl(canonicalPath, canonicalSearchParams),
    i18nUrl: routePattern,
    i18nUrlParams: params,
    alternateUrls: buildAlternateUrls(
      i18n.routes,
      paramVariants,
      buildUrl(canonicalPath, canonicalSearchParams),
      queryVariants,
      localeConfig,
    ),
    paramVariants: Object.fromEntries(paramVariants),
    queryVariants: Object.fromEntries(queryVariants),
  }

  return {
    localeConfig: { ...localeConfig, currentLocale },
    domainConfig,
    routeConfig,
  }
}
