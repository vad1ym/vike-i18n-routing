import { mergeLocales, normalizeLocales } from './locale/normalize'
import { matchRoutePattern, normalizePathname } from './route-patterns'
import { normalizeRoutes } from './routes'
import type {
  DomainConfig,
  FlatI18nRoutes,
  I18nConfig,
  I18nRoutes,
  LocaleCode,
  LocaleConfig,
  RedirectConfig,
} from './types'

const validatedConfigCache = new WeakSet<I18nConfig>()

function fail(message: string): never {
  throw new Error(`[vike-i18n] ${message}`)
}

function validateDefaultLocale(
  defaultLocale: LocaleCode,
  locales: Record<LocaleCode, LocaleConfig>,
  scope: string,
): void {
  if (locales[defaultLocale]) return

  const scopeLabel = scope ? `${scope} locales` : 'locales'
  fail(`defaultLocale "${defaultLocale}" is not listed in ${scopeLabel} [${Object.keys(locales).map((locale) => `"${locale}"`).join(', ')}].`)
}

function validateUniqueUrlPrefixes(
  locales: Record<LocaleCode, LocaleConfig>,
  scope?: string,
): void {
  const seen = new Map<string, string>()

  for (const [localeCode, localeConfig] of Object.entries(locales)) {
    const previousLocale = seen.get(localeConfig.urlPrefix)
    if (previousLocale) {
      const suffix = scope ? ` in ${scope}` : ''
      fail(`duplicate urlPrefix "${localeConfig.urlPrefix}"${suffix}. Locales "${previousLocale}" and "${localeCode}" cannot share the same prefix.`)
    }

    seen.set(localeConfig.urlPrefix, localeCode)
  }
}

function validateRouteKeys(routes: I18nRoutes, scope = 'routes'): void {
  for (const [routeKey, value] of Object.entries(routes)) {
    if (!routeKey.startsWith('/')) {
      fail(`${scope} key "${routeKey}" must start with "/".`)
    }

    const entries = Object.values(value)
    const isLeaf = entries.length > 0 && entries.every((entry) => typeof entry === 'string')
    if (!isLeaf) {
      validateRouteKeys(value as I18nRoutes, scope)
    }
  }
}

function warnUnknownRedirectTargets(
  redirects: RedirectConfig | undefined,
  routes: FlatI18nRoutes,
  scope?: string,
): void {
  if (!redirects) return

  const routeKeys = Object.keys(routes)

  for (const target of Object.values(redirects)) {
    const url = normalizePathname(typeof target === 'string' ? target : target.url)
    const isKnownRoute = routeKeys.some((routeKey) => (
      normalizePathname(routeKey) === url || matchRoutePattern(routeKey, url) != null
    ))
    if (isKnownRoute) continue

    const suffix = scope ? ` in ${scope}` : ''
    console.warn(
      `[vike-i18n] redirect target "${url}"${suffix} does not match any route key.`,
    )
  }
}

function validateDomainConfig(
  domain: string,
  domainConfig: DomainConfig,
  baseLocales: Record<LocaleCode, LocaleConfig>,
  baseRoutes: FlatI18nRoutes,
): void {
  if (domainConfig.routes) {
    validateRouteKeys(domainConfig.routes, `domains["${domain}"].routes`)
  }

  const locales = mergeLocales(baseLocales, domainConfig.locales)
  validateUniqueUrlPrefixes(locales, `domains["${domain}"]`)

  if (domainConfig.defaultLocale) {
    validateDefaultLocale(domainConfig.defaultLocale, locales, `domains["${domain}"]`)
  }

  const routes = domainConfig.routes
    ? { ...baseRoutes, ...normalizeRoutes(domainConfig.routes) }
    : baseRoutes

  warnUnknownRedirectTargets(domainConfig.redirects, routes, `domains["${domain}"]`)
}

export function validateI18nConfig(i18n: I18nConfig): void {
  if (validatedConfigCache.has(i18n)) return

  const locales = normalizeLocales(i18n.locales)
  validateDefaultLocale(i18n.defaultLocale, locales, '')
  validateUniqueUrlPrefixes(locales)
  validateRouteKeys(i18n.routes)

  const routes = normalizeRoutes(i18n.routes)

  warnUnknownRedirectTargets(i18n.redirects, routes)

  for (const [domain, domainConfig] of Object.entries(i18n.domains ?? {})) {
    validateDomainConfig(domain, domainConfig, locales, routes)
  }

  validatedConfigCache.add(i18n)
}
