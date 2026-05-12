import type { LocaleCode, LocaleConfig, LocaleConfigs } from '../types'

// Normalizes locale config to the internal record form.
export function normalizeLocales(locales: LocaleConfigs): Record<LocaleCode, LocaleConfig> {
  if (Array.isArray(locales)) {
    return Object.fromEntries(locales.map((code) => [code, { urlPrefix: code }]))
  }

  return locales
}
