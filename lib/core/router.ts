import { resolveDomainConfig } from './domain/normalize'
import { normalizeLocales } from './locale/normalize'
import { buildRoutePath, matchRoutePattern, normalizePathname } from './route-patterns'
import type {
  DetectorContext,
  I18nConfig,
  I18nRouter,
  LocaleCode,
  LocalizedPathOptions,
  ResolvedDomainConfig,
  ResolvedRouteResult,
  ResolveRouteOptions,
  RouteSlugVariants,
} from './types'

type RouteDefinition = {
  canonicalPattern: string
  localizedPatterns: Record<string, string>
}

type RouteMatch = {
  route: RouteDefinition
  canonicalPath: string
  matchedLocale: string
  expectedLocalizedPath: string
  params: Record<string, string>
}

type ParamVariantConfig = {
  redirect: boolean
  variants: RouteSlugVariants
}

const routeSlugVariants = new Map<string, ParamVariantConfig>()
const routerCache = new WeakMap<I18nConfig, I18nRouter>()

// Registers locale-specific slug variants for a dynamic route param.
export function setRouteSlugVariants(
  paramName: string,
  variants: RouteSlugVariants,
  options?: { redirect?: boolean },
) {
  routeSlugVariants.set(paramName, {
    variants,
    redirect: options?.redirect ?? false,
  })
}

// Creates a reusable router instance with precomputed route definitions.
export function createI18nRouter(i18n: I18nConfig): I18nRouter {
  const cached = routerCache.get(i18n)
  if (cached) return cached

  const routes = createRouteDefinitions(i18n)

  const router: I18nRouter = {
    resolve(pathname, options) {
      return resolveIncomingRoute(pathname, i18n, routes, options)
    },
    resolveCanonical(pathname, context) {
      return resolveCanonicalPath(pathname, i18n, routes, context)
    },
    resolveLocalizedPath(routeKey, locale, context, options) {
      return buildLocalizedRoutePath(routeKey, locale, i18n, routes, context, options)
    },
    getAlternates(url, context) {
      const resolvedDomain = resolveDomainConfig(i18n, context)

      return Object.keys(resolvedDomain.locales).map((locale) => ({
        locale,
        url: buildLocalizedRoutePath(url, locale, i18n, routes, context, {
          prefixDefaultLocale: true,
        }),
      }))
    },
  }

  routerCache.set(i18n, router)
  return router
}

// Builds the immutable route table used by the router.
function createRouteDefinitions(i18n: I18nConfig): RouteDefinition[] {
  return Object.entries(i18n.routes).map(([canonicalPattern, localizedPatterns]) => ({
    canonicalPattern,
    localizedPatterns,
  }))
}

// Picks the canonical locale used as the source of truth for slug variants.
function getDefaultVariantLocale(
  paramName: string,
  resolvedDomain: ResolvedDomainConfig,
): string | undefined {
  const variants = routeSlugVariants.get(paramName)?.variants
  if (!variants) return undefined

  return variants[resolvedDomain.defaultLocale]
    ? resolvedDomain.defaultLocale
    : Object.keys(variants)[0]
}

// Converts any localized slug variant back to the canonical variant value.
function canonicalizeParamValue(
  paramName: string,
  rawValue: string,
  resolvedDomain: ResolvedDomainConfig,
): string {
  const variants = routeSlugVariants.get(paramName)?.variants
  if (!variants) return rawValue

  const defaultVariantLocale = getDefaultVariantLocale(paramName, resolvedDomain)
  const defaultValue = defaultVariantLocale ? variants[defaultVariantLocale] : undefined

  for (const variant of Object.values(variants)) {
    if (variant === rawValue) return defaultValue ?? rawValue
  }

  return rawValue
}

// Converts a canonical param value into the locale-specific slug variant.
function localizeParamValue(
  paramName: string,
  canonicalValue: string,
  locale: string,
  resolvedDomain: ResolvedDomainConfig,
): string {
  const variants = routeSlugVariants.get(paramName)?.variants
  if (!variants) return canonicalValue

  const defaultVariantLocale = getDefaultVariantLocale(paramName, resolvedDomain)
  const defaultValue = defaultVariantLocale ? variants[defaultVariantLocale] : undefined

  if (defaultValue === canonicalValue && variants[locale]) {
    return variants[locale]
  }

  for (const variant of Object.values(variants)) {
    if (variant === canonicalValue) {
      return variants[locale] ?? canonicalValue
    }
  }

  return variants[locale] && locale === resolvedDomain.defaultLocale && defaultValue === undefined
    ? variants[locale]
    : canonicalValue
}

// Builds a concrete localized path from a pattern and canonical params.
function buildConcretePath(
  pattern: string,
  params: Record<string, string | undefined>,
  locale: string,
  resolvedDomain: ResolvedDomainConfig,
): string {
  const localizedParams = Object.fromEntries(
    Object.entries(params).map(([name, value]) => [
      name,
      value ? localizeParamValue(name, value, locale, resolvedDomain) : value,
    ]),
  )

  return buildRoutePath(pattern, localizedParams)
}

// Matches a concrete path against a pattern and canonicalizes slug variants.
function matchConcretePath(
  pattern: string,
  pathname: string,
  resolvedDomain: ResolvedDomainConfig,
): Record<string, string> | null {
  const params = matchRoutePattern(pattern, pathname)
  if (!params) return null

  return Object.fromEntries(
    Object.entries(params).map(([name, value]) => [
      name,
      value ? canonicalizeParamValue(name, value, resolvedDomain) : '',
    ]),
  )
}

// Resolves the route pattern that should be used for a locale.
function getLocalizedPattern(route: RouteDefinition, locale: string): string {
  return route.localizedPatterns[locale] ?? route.canonicalPattern
}

// Finds the best localized route match for a concrete path.
function findLocalizedRouteMatch(
  pathname: string,
  routes: RouteDefinition[],
  resolvedDomain: ResolvedDomainConfig,
  preferredLocale?: string,
): RouteMatch | null {
  const normalizedPathname = normalizePathname(pathname)
  const locales = Object.keys(resolvedDomain.locales)
  const orderedLocales = preferredLocale
    ? [preferredLocale, ...locales.filter((locale) => locale !== preferredLocale)]
    : locales

  for (const route of routes) {
    for (const locale of orderedLocales) {
      const params = matchConcretePath(
        getLocalizedPattern(route, locale),
        normalizedPathname,
        resolvedDomain,
      )

      if (!params) continue

      return {
        route,
        params,
        matchedLocale: locale,
        canonicalPath: buildConcretePath(
          route.canonicalPattern,
          params,
          resolvedDomain.defaultLocale,
          resolvedDomain,
        ),
        expectedLocalizedPath: buildConcretePath(
          getLocalizedPattern(route, locale),
          params,
          locale,
          resolvedDomain,
        ),
      }
    }
  }

  return null
}

// Finds a canonical route match without using translated patterns.
function findCanonicalRouteMatch(
  pathname: string,
  routes: RouteDefinition[],
  resolvedDomain: ResolvedDomainConfig,
): RouteMatch | null {
  const normalizedPathname = normalizePathname(pathname)

  for (const route of routes) {
    const params = matchConcretePath(route.canonicalPattern, normalizedPathname, resolvedDomain)
    if (!params) continue

    return {
      route,
      params,
      matchedLocale: resolvedDomain.defaultLocale,
      canonicalPath: buildConcretePath(
        route.canonicalPattern,
        params,
        resolvedDomain.defaultLocale,
        resolvedDomain,
      ),
      expectedLocalizedPath: buildConcretePath(
        getLocalizedPattern(route, resolvedDomain.defaultLocale),
        params,
        resolvedDomain.defaultLocale,
        resolvedDomain,
      ),
    }
  }

  return null
}

// Adds or removes the locale prefix according to the resolved domain rules.
function applyLocalePrefix(
  pathname: string,
  locale: LocaleCode,
  resolvedDomain: ResolvedDomainConfig,
  options?: LocalizedPathOptions,
): string {
  const normalized = normalizePathname(pathname)
  const localeConfig = normalizeLocales(resolvedDomain.locales)[locale]

  if (!localeConfig) {
    throw new Error(`[vike-i18n] Unknown locale: "${locale}"`)
  }

  const forceNoPrefix = options?.noPrefixLocale === true || options?.prefixLocale === false
  const shouldPrefixDefault = options?.prefixDefaultLocale ?? resolvedDomain.prefixDefaultLocale

  if (forceNoPrefix || (locale === resolvedDomain.defaultLocale && !shouldPrefixDefault)) {
    return normalized
  }

  const prefix = `/${localeConfig.urlPrefix}`
  return normalized === '/' ? prefix : `${prefix}${normalized}`
}

// Converts any pathname to its canonical route path.
function resolveCanonicalPath(
  pathname: string,
  i18n: I18nConfig,
  routes: RouteDefinition[],
  context: DetectorContext,
): string {
  const resolvedDomain = resolveDomainConfig(i18n, context)
  const locales = normalizeLocales(resolvedDomain.locales)
  const parts = normalizePathname(pathname).split('/').filter(Boolean)
  const hasPrefix = Object.values(locales).some((config) => config.urlPrefix === parts[0])
  const pathWithoutPrefix = hasPrefix
    ? normalizePathname(`/${parts.slice(1).join('/')}`)
    : normalizePathname(pathname)

  const localizedMatch = findLocalizedRouteMatch(pathWithoutPrefix, routes, resolvedDomain)
  if (localizedMatch) return localizedMatch.canonicalPath

  const canonicalMatch = findCanonicalRouteMatch(pathWithoutPrefix, routes, resolvedDomain)
  if (canonicalMatch) return canonicalMatch.canonicalPath

  return pathWithoutPrefix
}

// Converts a canonical route or URL into the localized concrete path for a locale.
function buildLocalizedRoutePath(
  routeKey: string,
  locale: LocaleCode,
  i18n: I18nConfig,
  routes: RouteDefinition[],
  context: DetectorContext,
  options?: LocalizedPathOptions,
): string {
  const resolvedDomain = resolveDomainConfig(i18n, context)
  const canonicalPath = resolveCanonicalPath(routeKey, i18n, routes, context)
  const canonicalMatch = findCanonicalRouteMatch(canonicalPath, routes, resolvedDomain)

  const localizedPath = canonicalMatch
    ? buildConcretePath(
        getLocalizedPattern(canonicalMatch.route, locale),
        canonicalMatch.params,
        locale,
        resolvedDomain,
      )
    : normalizePathname(canonicalPath)

  return applyLocalePrefix(localizedPath, locale, resolvedDomain, options)
}

// Resolves an incoming pathname to locale, canonical route, and redirect metadata.
function resolveIncomingRoute(
  pathname: string,
  i18n: I18nConfig,
  routes: RouteDefinition[],
  options: ResolveRouteOptions,
): ResolvedRouteResult {
  const resolvedDomain = resolveDomainConfig(i18n, options.context)
  const locales = normalizeLocales(resolvedDomain.locales)
  const parts = normalizePathname(pathname).split('/').filter(Boolean)
  const prefixedLocale = Object.entries(locales).find(([, config]) => config.urlPrefix === parts[0])?.[0]

  if (prefixedLocale) {
    const localizedPath = normalizePathname(`/${parts.slice(1).join('/')}`)
    const match = findLocalizedRouteMatch(localizedPath, routes, resolvedDomain, prefixedLocale)

    if (resolvedDomain.prefixDefaultLocale === false && prefixedLocale === resolvedDomain.defaultLocale) {
      const canonicalPath = match?.canonicalPath ?? localizedPath
      return {
        locale: prefixedLocale,
        canonical: canonicalPath,
        deferredRedirectTo: buildLocalizedRoutePath(
          canonicalPath,
          prefixedLocale,
          i18n,
          routes,
          options.context,
          { prefixDefaultLocale: false },
        ),
        domain: resolvedDomain.domain,
        domainMeta: resolvedDomain.meta,
      }
    }

    if (!match) {
      return {
        locale: prefixedLocale,
        canonical: localizedPath,
        domain: resolvedDomain.domain,
        domainMeta: resolvedDomain.meta,
      }
    }

    if (match.matchedLocale !== prefixedLocale || match.expectedLocalizedPath !== localizedPath) {
      return {
        locale: prefixedLocale,
        canonical: match.canonicalPath,
        redirectTo: buildLocalizedRoutePath(
          match.canonicalPath,
          prefixedLocale,
          i18n,
          routes,
          options.context,
        ),
        domain: resolvedDomain.domain,
        domainMeta: resolvedDomain.meta,
      }
    }

    return {
      locale: prefixedLocale,
      canonical: match.canonicalPath,
      domain: resolvedDomain.domain,
      domainMeta: resolvedDomain.meta,
    }
  }

  const locale = options.detectedLocale ?? resolvedDomain.defaultLocale
  const canonical = resolveCanonicalPath(pathname, i18n, routes, options.context)

  if (locale === resolvedDomain.defaultLocale && resolvedDomain.prefixDefaultLocale === false) {
    return {
      locale,
      canonical,
      domain: resolvedDomain.domain,
      domainMeta: resolvedDomain.meta,
    }
  }

  return {
    locale,
    canonical,
    redirectTo: buildLocalizedRoutePath(canonical, locale, i18n, routes, options.context),
    domain: resolvedDomain.domain,
    domainMeta: resolvedDomain.meta,
  }
}
