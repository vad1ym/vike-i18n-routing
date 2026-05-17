import type { LocaleCode, LocaleConfig, LocaleConfigs } from '../types'

const normalizedCache = new WeakMap<readonly string[], Record<LocaleCode, LocaleConfig>>()

// Normalizes locale config to the internal record form.
export function normalizeLocales(locales: LocaleConfigs): Record<LocaleCode, LocaleConfig> {
  if (Array.isArray(locales)) {
    const cached = normalizedCache.get(locales)
    if (cached) return cached
    const result = Object.fromEntries(locales.map((code) => [code, { urlPrefix: code }]))
    normalizedCache.set(locales, result)
    return result
  }

  return locales
}
