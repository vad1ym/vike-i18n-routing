import { detectDomain, resolveDomainConfig } from './domain/normalize'
import { detectRequestLocale, resolveCookieLocale } from './locale/detector'
import { getI18nConfig } from './pageContext'
import { buildRoutePath, matchRoutePattern, normalizePathname } from './route-patterns'
import type {
  AlternateUrl,
  I18nConfig,
  I18nPageContext,
  I18nRoute,
  I18nRouter,
  I18nRoutes,
  LocaleCode,
  LocalizedPathOptions,
  PageContextLocaleConfig,
  ResolvedI18nRoute,
  RouteConfig,
  RouteParamVariants,
} from './types'

// Stores redirect flag alongside locale-specific slug values for a single param.
// Example: { redirect: true, variants: { en: 'about-us', ru: 'o-nas' } }
type ParamVariantConfig = {
  redirect: boolean
  variants: RouteParamVariants
}

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

// Param variants are stored on pageContext via a Symbol to avoid property collisions.
// They persist across multiple resolve() calls within the same request.
const paramVariantsKey = Symbol('vike-i18n-routing.param-variants')

function getParamVariants(pageContext: I18nPageContext): ParamVariants {
  const ctx = pageContext as I18nPageContext & { [paramVariantsKey]?: ParamVariants }
  return (ctx[paramVariantsKey] ??= new Map())
}

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

  const forceNoPrefix = options?.noPrefixLocale === true || options?.prefixLocale === false
  const shouldPrefixDefault = options?.prefixDefaultLocale ?? localeConfig.prefixDefaultLocale

  if (forceNoPrefix || (locale === localeConfig.defaultLocale && !shouldPrefixDefault)) {
    return normalized
  }

  const prefix = `/${targetLocaleConfig.urlPrefix}`
  return normalized === '/' ? prefix : `${prefix}${normalized}`
}

// Converts a canonical path (e.g. '/about') to a fully localized URL
// (e.g. '/ru/o-nas') by finding the route, building the localized path,
// and applying the locale prefix.
function localizeCanonicalPath(
  routes: I18nRoutes,
  paramVariants: ParamVariants,
  canonicalPath: string,
  locale: LocaleCode,
  localeConfig: PageContextLocaleConfig,
  options?: LocalizedPathOptions,
): string {
  const match = findCanonicalRouteMatch(routes, paramVariants, canonicalPath, localeConfig)
  const localizedPath = match
    ? buildConcretePath(
        paramVariants,
        getLocalizedPattern(match.localizedPatterns, match.canonicalPattern, locale),
        match.params,
        localeConfig,
        locale,
      )
    : normalizePathname(canonicalPath)

  return applyLocalePrefix(localizedPath, locale, localeConfig, options)
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
    if (!config?.redirect) return false

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
// Resolves the three config objects that make up I18nRoute:
// - requestConfig: detected locale, domain, cookie locale
// - localeConfig: available locales, default locale, prefix settings
// - domainConfig: domain-specific overrides (if multi-domain setup)
// ────────────────────────────────────────────────────────────────

function resolveConfigs(pageContext: I18nPageContext, i18n: I18nConfig) {
  const domain = detectDomain(pageContext, i18n)
  const ctxWithDomain = domain ? { ...pageContext, domain } : pageContext

  const requestConfig = {
    locale: detectRequestLocale(ctxWithDomain, i18n),
    domain,
    cookieLocale: resolveCookieLocale(pageContext, i18n),
  }

  const resolved = resolveDomainConfig(i18n, ctxWithDomain)

  const localeConfig: PageContextLocaleConfig = {
    defaultLocale: resolved.defaultLocale,
    locales: resolved.locales,
    currentLocale: requestConfig.locale,
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

  return { requestConfig, localeConfig, domainConfig }
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
  localeConfig: PageContextLocaleConfig,
): AlternateUrl[] {
  return Object.keys(localeConfig.locales).map((locale) => ({
    locale,
    url: localizeCanonicalPath(routes, paramVariants, canonicalPath, locale, localeConfig, {
      prefixDefaultLocale: localeConfig.prefixDefaultLocale,
    }),
  }))
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
//    Detect domain, locale (from cookie/header/URL), and build
//    requestConfig, localeConfig, domainConfig.
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
//    Returns { i18nRoute, redirectTo } where:
//    - i18nRoute contains requestConfig, localeConfig, domainConfig, routeConfig,
//      and a setRouteParamVariants() method for runtime slug registration
//    - redirectTo is the URL to redirect to, or undefined if no redirect needed
// ────────────────────────────────────────────────────────────────

function resolveI18nRouteState(
  pageContext: I18nPageContext,
  i18n: I18nConfig,
  paramVariants: ParamVariants,
  pathname: string,
): ResolvedI18nRoute {
  // Step 1: Resolve configs
  const { requestConfig, localeConfig, domainConfig } = resolveConfigs(pageContext, i18n)

  // Step 2: Extract locale from URL prefix
  const requestUrl = normalizePathname(pathname)
  const segments = requestUrl.split('/').filter(Boolean)
  const prefixedLocale = Object.entries(localeConfig.locales).find(
    ([, config]) => config.urlPrefix === segments[0],
  )?.[0]
  const currentLocale = prefixedLocale ?? requestConfig.locale ?? localeConfig.defaultLocale
  const localizedRequestUrl = prefixedLocale
    ? normalizePathname(`/${segments.slice(1).join('/')}`)
    : requestUrl

  // Step 3: Match route (localized first, then canonical fallback)
  const localizedMatch = findLocalizedRouteMatch(
    i18n.routes, paramVariants, localizedRequestUrl, localeConfig, currentLocale,
  )
  const canonicalMatch = localizedMatch
    ?? findCanonicalRouteMatch(i18n.routes, paramVariants, localizedRequestUrl, localeConfig)
  const canonicalPath = canonicalMatch?.canonicalPath ?? localizedRequestUrl
  const routePattern = canonicalMatch?.canonicalPattern ?? canonicalPath
  const params = canonicalMatch?.params ?? {}

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

  const currentLocaleUrl = applyLocalePrefix(currentLocalePath, currentLocale, localeConfig)
  const defaultLocaleUrl = applyLocalePrefix(defaultLocalePath, localeConfig.defaultLocale, localeConfig)

  // Step 5: Determine redirect
  const variantRedirectPath = localizedMatch
    ? getVariantRedirectPath(
        paramVariants, localizedMatch.canonicalPattern, localizedMatch.localizedPatterns,
        localizedRequestUrl, currentLocale, localeConfig,
      )
    : undefined

  const redirectTo = variantRedirectPath
    ? applyLocalePrefix(variantRedirectPath, currentLocale, localeConfig)
    : requestUrl !== currentLocaleUrl
      ? currentLocaleUrl
      : undefined

  // Step 6: Assemble result
  const routeConfig: RouteConfig = {
    requestUrl,
    defaultLocaleUrl,
    currentLocaleUrl,
    vikeUrl: canonicalPath,
    i18nUrl: routePattern,
    vikeUrlParams: params,
    i18nUrlParams: params,
    alternateUrls: buildAlternateUrls(i18n.routes, paramVariants, canonicalPath, localeConfig),
  }

  const i18nRoute: I18nRoute = {
    requestConfig,
    localeConfig: { ...localeConfig, currentLocale },
    domainConfig,
    routeConfig,
    // Allows registering locale-specific slug variants at runtime (e.g. from a CMS).
    // Re-resolves the entire route to update routeConfig with new variant values.
    setRouteParamVariants(paramName, variants, options) {
      paramVariants.set(paramName, { variants, redirect: options?.redirect ?? false })
      const next = resolveI18nRouteState(pageContext, i18n, paramVariants, pathname)
      this.localeConfig.currentLocale = next.i18nRoute.localeConfig.currentLocale
      this.routeConfig = next.i18nRoute.routeConfig
      return next.redirectTo
    },
  }

  return { i18nRoute, redirectTo }
}

// ────────────────────────────────────────────────────────────────
// Public API
//
// createI18nRouter is the main entry point. It captures pageContext
// and provides three methods:
// - resolve(pathname): full route resolution with redirect detection
// - resolveLocalizedPath(routeKey, locale): build a localized URL for a route
// - setRouteParamVariants(paramName, variants): register slug variants
// ────────────────────────────────────────────────────────────────

export function createI18nRouter(pageContext: I18nPageContext): I18nRouter {
  const i18n = getI18nConfig(pageContext)
  const paramVariants = getParamVariants(pageContext)

  return {
    setRouteParamVariants(paramName, variants, options) {
      paramVariants.set(paramName, { variants, redirect: options?.redirect ?? false })
    },
    resolve(pathname) {
      return resolveI18nRouteState(pageContext, i18n, paramVariants, pathname)
    },
    resolveLocalizedPath(routeKey, locale, options) {
      const { localeConfig } = resolveConfigs(pageContext, i18n)
      const canonicalPath = resolveI18nRouteState(pageContext, i18n, paramVariants, routeKey).i18nRoute.routeConfig.vikeUrl
      return localizeCanonicalPath(i18n.routes, paramVariants, canonicalPath, locale, localeConfig, options)
    },
  }
}
