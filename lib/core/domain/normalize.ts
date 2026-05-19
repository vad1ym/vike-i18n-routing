import { getDomain } from '../pageContext'
import { mergeLocales, normalizeLocales } from '../locale/normalize'
import type { DomainConfig, I18nConfig, I18nPageContext, ResolvedDomainConfig } from '../types'

export function detectDomain(pageContext: I18nPageContext, i18n: I18nConfig): string | undefined {
  const custom = i18n.domainDetector?.(pageContext)
  if (custom) return custom.toLowerCase()
  return getDomain(pageContext)
}

// Resolves the effective domain config by combining global defaults with domain overrides.
export function resolveDomainConfig(
  i18n: I18nConfig,
  pageContext: I18nPageContext,
): ResolvedDomainConfig {
  const domain = detectDomain(pageContext, i18n)
  return resolveDomainConfigForDomain(i18n, domain)
}

const resolvedDomainConfigCache = new WeakMap<I18nConfig, Map<string, ResolvedDomainConfig>>()

export function resolveDomainConfigForDomain(
  i18n: I18nConfig,
  domain: string | undefined,
): ResolvedDomainConfig {
  let cachedByDomain = resolvedDomainConfigCache.get(i18n)
  if (!cachedByDomain) {
    cachedByDomain = new Map()
    resolvedDomainConfigCache.set(i18n, cachedByDomain)
  }

  const cacheKey = domain ?? ''
  const cached = cachedByDomain.get(cacheKey)
  if (cached) return cached

  const domainConfig = domain ? resolveMatchingDomainConfig(domain, i18n.domains) : undefined
  const baseLocales = normalizeLocales(i18n.locales)
  const locales = mergeLocales(baseLocales, domainConfig?.locales)
  const resolved: ResolvedDomainConfig = {
    domain: domainConfig ? domain : undefined,
    defaultLocale: domainConfig?.defaultLocale ?? i18n.defaultLocale,
    locales,
    prefixDefaultLocale: domainConfig?.prefixDefaultLocale ?? i18n.prefixDefaultLocale !== false,
    meta: domainConfig?.meta,
    routes: domainConfig?.routes,
    redirects: domainConfig?.redirects,
  }

  cachedByDomain.set(cacheKey, resolved)
  return resolved
}

function resolveMatchingDomainConfig(
  domain: string,
  domains: Record<string, DomainConfig> | undefined,
): DomainConfig | undefined {
  if (!domains) return undefined

  const exactMatch = domains[domain]
  if (exactMatch) return exactMatch

  let bestMatch: { config: DomainConfig; specificity: number } | undefined

  for (const [pattern, config] of Object.entries(domains)) {
    if (!pattern.startsWith('*.')) continue

    const suffix = pattern.slice(2)
    if (!suffix) continue
    if (domain === suffix) continue
    if (!domain.endsWith(`.${suffix}`)) continue

    const specificity = suffix.split('.').length
    if (!bestMatch || specificity > bestMatch.specificity) {
      bestMatch = { config, specificity }
    }
  }

  return bestMatch?.config
}
