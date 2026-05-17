import { normalizePathname } from './route-patterns'
import type { LocaleCode, LocalizedPathOptions, PageContextLocaleConfig } from './types'

export function buildUrl(pathname: string, searchParams: URLSearchParams): string {
  const search = searchParams.toString()
  return search ? `${pathname}?${search}` : pathname
}

export function applyLocalePrefix(
  pathname: string,
  locale: LocaleCode,
  localeConfig: PageContextLocaleConfig,
  options?: LocalizedPathOptions,
): string {
  const normalized = normalizePathname(pathname)
  const targetLocaleConfig = localeConfig.locales[locale]

  if (!targetLocaleConfig) {
    throw new Error(`[vike-i18n] Unknown locale: "${locale}"`)
  }

  if (options?.prefix === false || (options?.prefix === undefined && locale === localeConfig.defaultLocale && !localeConfig.prefixDefaultLocale)) {
    return normalized
  }

  const prefix = `/${targetLocaleConfig.urlPrefix}`
  return normalized === '/' ? prefix : `${prefix}${normalized}`
}

export function buildLocalizedUrl(
  pathname: string,
  searchParams: URLSearchParams,
  locale: LocaleCode,
  localeConfig: PageContextLocaleConfig,
): string {
  return buildUrl(
    applyLocalePrefix(pathname, locale, localeConfig),
    searchParams,
  )
}

export function buildSetLocaleRedirect(
  pathname: string,
  locale: LocaleCode,
): string {
  const url = new URL(pathname, 'http://localhost')
  url.searchParams.set('locale', locale)
  return `${url.pathname}${url.search}`
}
