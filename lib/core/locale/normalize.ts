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

function mergeLocaleConfig(
  baseConfig: LocaleConfig | undefined,
  overrideConfig: LocaleConfig | undefined,
): LocaleConfig {
  const urlPrefix = overrideConfig?.urlPrefix ?? baseConfig?.urlPrefix
  if (!urlPrefix) {
    throw new Error('[vike-i18n] Locale config is missing urlPrefix')
  }

  const meta = baseConfig?.meta || overrideConfig?.meta
    ? { ...baseConfig?.meta, ...overrideConfig?.meta }
    : undefined

  return {
    ...(baseConfig ?? {}),
    ...(overrideConfig ?? {}),
    urlPrefix,
    ...(meta ? { meta } : {}),
  }
}

export function mergeLocales(
  baseLocales: Record<LocaleCode, LocaleConfig>,
  overrideLocales: LocaleConfigs | undefined,
): Record<LocaleCode, LocaleConfig> {
  if (!overrideLocales) return baseLocales

  if (Array.isArray(overrideLocales)) {
    return Object.fromEntries(
      overrideLocales.map((localeCode) => [
        localeCode,
        mergeLocaleConfig(baseLocales[localeCode], { urlPrefix: localeCode }),
      ]),
    )
  }

  return Object.fromEntries(
    Object.entries(overrideLocales).map(([localeCode, localeConfig]) => [
      localeCode,
      mergeLocaleConfig(baseLocales[localeCode], localeConfig),
    ]),
  )
}
