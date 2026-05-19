import type { PageContextLocaleConfig, ParamVariantConfig, QueryVariantConfig } from './types'

export type ParamVariants = Map<string, ParamVariantConfig>
export type QueryVariants = Map<string, QueryVariantConfig>

type CompiledVariantLookup = {
  byLocale: Record<string, string>
  toCanonical: Map<string, string>
}

function getDefaultVariantLocale(
  variants: Record<string, string>,
  localeConfig: PageContextLocaleConfig,
): string | undefined {
  return variants[localeConfig.defaultLocale]
    ? localeConfig.defaultLocale
    : Object.keys(variants)[0]
}

const compiledVariantLookupCache = new WeakMap<Record<string, string>, CompiledVariantLookup>()

function getCompiledVariantLookup(
  variants: Record<string, string>,
  localeConfig: PageContextLocaleConfig,
): CompiledVariantLookup {
  const cached = compiledVariantLookupCache.get(variants)
  if (cached) return cached

  const defaultLocale = getDefaultVariantLocale(variants, localeConfig)
  const canonicalValue = defaultLocale ? variants[defaultLocale] : ''
  const toCanonical = new Map<string, string>()
  for (const variant of Object.values(variants)) {
    toCanonical.set(variant, canonicalValue || variant)
  }

  const compiled = {
    byLocale: variants,
    toCanonical,
  } satisfies CompiledVariantLookup
  compiledVariantLookupCache.set(variants, compiled)
  return compiled
}

export function canonicalizeVariantValue(
  variants: Record<string, string> | undefined,
  rawValue: string,
  localeConfig: PageContextLocaleConfig,
): string {
  if (!variants) return rawValue

  return getCompiledVariantLookup(variants, localeConfig).toCanonical.get(rawValue) ?? rawValue
}

export function localizeVariantValue(
  variants: Record<string, string> | undefined,
  canonicalValue: string,
  localeConfig: PageContextLocaleConfig,
  locale = localeConfig.defaultLocale,
): string {
  if (!variants) return canonicalValue

  const compiled = getCompiledVariantLookup(variants, localeConfig)
  return compiled.toCanonical.has(canonicalValue)
    ? compiled.byLocale[locale] ?? canonicalValue
    : canonicalValue
}

export function canonicalizeParamValue(
  paramVariants: ParamVariants,
  paramName: string,
  rawValue: string,
  localeConfig: PageContextLocaleConfig,
): string {
  return canonicalizeVariantValue(paramVariants.get(paramName)?.variants, rawValue, localeConfig)
}

export function localizeParamValue(
  paramVariants: ParamVariants,
  paramName: string,
  canonicalValue: string,
  localeConfig: PageContextLocaleConfig,
  locale = localeConfig.defaultLocale,
): string {
  return localizeVariantValue(paramVariants.get(paramName)?.variants, canonicalValue, localeConfig, locale)
}

export function canonicalizeQueryValue(
  queryVariants: QueryVariants,
  queryName: string,
  rawValue: string,
  localeConfig: PageContextLocaleConfig,
): string {
  return canonicalizeVariantValue(queryVariants.get(queryName)?.variants, rawValue, localeConfig)
}

export function localizeQueryValue(
  queryVariants: QueryVariants,
  queryName: string,
  canonicalValue: string,
  localeConfig: PageContextLocaleConfig,
  locale = localeConfig.defaultLocale,
): string {
  return localizeVariantValue(queryVariants.get(queryName)?.variants, canonicalValue, localeConfig, locale)
}

export function localizeNamedQueryValue(
  queryVariants: QueryVariants,
  queryName: string,
  value: string,
  localeConfig: PageContextLocaleConfig,
  locale = localeConfig.defaultLocale,
): string {
  return localizeQueryValue(queryVariants, queryName, value, localeConfig, locale)
}

export function canonicalizeQueryParams(
  queryVariants: QueryVariants,
  searchParams: URLSearchParams,
  localeConfig: PageContextLocaleConfig,
): URLSearchParams {
  const canonical = new URLSearchParams()

  for (const [name, value] of sanitizeRouteSearchParams(searchParams).entries()) {
    canonical.append(name, canonicalizeQueryValue(queryVariants, name, value, localeConfig))
  }

  return canonical
}

export function localizeQueryParams(
  queryVariants: QueryVariants,
  searchParams: URLSearchParams,
  localeConfig: PageContextLocaleConfig,
  locale = localeConfig.defaultLocale,
): URLSearchParams {
  const localized = new URLSearchParams()

  for (const [name, value] of searchParams.entries()) {
    localized.append(name, localizeQueryValue(queryVariants, name, value, localeConfig, locale))
  }

  return localized
}

export function sanitizeRouteSearchParams(searchParams: URLSearchParams): URLSearchParams {
  const sanitized = new URLSearchParams(searchParams)
  sanitized.delete('locale')
  sanitized.delete('lang')
  return sanitized
}
