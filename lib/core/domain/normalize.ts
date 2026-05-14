import { getDomain } from '../pageContext'
import { normalizeLocales } from '../locale/normalize'
import type { I18nConfig, I18nPageContext, ResolvedDomainConfig } from '../types'

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
  const domainConfig = domain ? i18n.domains?.[domain] : undefined
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
  }
}
