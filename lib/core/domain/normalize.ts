import { detectDomain } from './detector'
import { normalizeLocales } from '../locale/normalize'
import type { DetectorContext, I18nConfig, ResolvedDomainConfig } from '../types'

// Resolves the effective domain config by combining global defaults with domain overrides.
export function resolveDomainConfig(
  i18n: I18nConfig,
  context: DetectorContext,
): ResolvedDomainConfig {
  const baseLocales = normalizeLocales(i18n.locales)
  const domain = detectDomain(context, i18n)
  const domainConfig = domain ? i18n.domains?.[domain] : undefined
  const locales = domainConfig?.locales
    ? normalizeLocales(domainConfig.locales)
    : baseLocales
  const defaultLocale = domainConfig?.defaultLocale ?? i18n.defaultLocale

  return {
    domain,
    defaultLocale,
    locales,
    prefixDefaultLocale: domainConfig?.prefixDefaultLocale ?? i18n.prefixDefaultLocale !== false,
    meta: domainConfig?.meta,
  }
}
