import { getDomain } from '../pageContext'
import { normalizeLocales } from '../locale/normalize'
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
  const domainConfig = domain ? resolveMatchingDomainConfig(domain, i18n.domains) : undefined
  const baseLocales = normalizeLocales(i18n.locales)
  const locales = domainConfig?.locales
    ? normalizeLocales(domainConfig.locales)
    : baseLocales
  const defaultLocale = domainConfig?.defaultLocale ?? i18n.defaultLocale

  return {
    domain: domainConfig ? domain : undefined,
    defaultLocale,
    locales,
    prefixDefaultLocale: domainConfig?.prefixDefaultLocale ?? i18n.prefixDefaultLocale !== false,
    meta: domainConfig?.meta,
    routes: domainConfig?.routes,
    redirects: domainConfig?.redirects,
  }
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
