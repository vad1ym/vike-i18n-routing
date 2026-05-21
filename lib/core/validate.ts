import { mergeLocales, normalizeLocales } from './locale/normalize'
import { matchRoutePattern, normalizePathname } from './route-patterns'
import { normalizeRoutes } from './routes'
import type {
  AliasConfig,
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

function validateAliases(aliases: AliasConfig | undefined, scope?: string): void {
  if (!aliases) return

  const prefix = scope ? ` in ${scope}` : ''
  const aliasKeys = Object.keys(aliases)

  // Detect cycles: build a static alias→target map and walk chains
  // Only static (non-parametric) keys are checked since dynamic ones can't form deterministic cycles
  const staticTargets = new Map<string, string>()
  for (const [aliasKey, value] of Object.entries(aliases)) {
    const isDynamic = aliasKey.includes(':') || aliasKey.includes('@') || aliasKey.includes('{') || aliasKey.includes('*')
    if (!isDynamic) {
      const target = typeof value === 'string' ? value : value.target
      staticTargets.set(normalizePathname(aliasKey), normalizePathname(target))
    }
  }

  for (const [start] of staticTargets) {
    const visited = new Set<string>()
    let current: string | undefined = start
    while (current && staticTargets.has(current)) {
      if (visited.has(current)) {
        fail(`alias cycle detected${prefix}: "${start}" eventually resolves back to itself.`)
      }
      visited.add(current)
      current = staticTargets.get(current)
    }
  }

  // Detect duplicate static alias keys (case-insensitive normalized)
  const seenKeys = new Map<string, string>()
  for (const aliasKey of aliasKeys) {
    const normalized = normalizePathname(aliasKey)
    const existing = seenKeys.get(normalized)
    if (existing) {
      fail(`duplicate alias key${prefix}: "${existing}" and "${aliasKey}" resolve to the same path.`)
    }
    seenKeys.set(normalized, aliasKey)
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
  validateAliases(domainConfig.aliases, `domains["${domain}"]`)
}

export function validateI18nConfig(i18n: I18nConfig): void {
  if (validatedConfigCache.has(i18n)) return

  const locales = normalizeLocales(i18n.locales)
  validateDefaultLocale(i18n.defaultLocale, locales, '')
  validateUniqueUrlPrefixes(locales)
  validateRouteKeys(i18n.routes)

  const routes = normalizeRoutes(i18n.routes)

  warnUnknownRedirectTargets(i18n.redirects, routes)
  validateAliases(i18n.aliases)

  for (const [domain, domainConfig] of Object.entries(i18n.domains ?? {})) {
    validateDomainConfig(domain, domainConfig, locales, routes)
  }

  validatedConfigCache.add(i18n)
}
