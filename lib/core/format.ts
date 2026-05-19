import { normalizePathname } from './route-patterns'
import type { LocaleCode, LocalizedPathOptions, PageContextLocaleConfig, TrailingSlash } from './types'

export function applyTrailingSlash(pathname: string, mode: TrailingSlash): string {
  if (pathname === '/') return '/'
  if (mode === 'always') return pathname.endsWith('/') ? pathname : `${pathname}/`
  if (mode === 'never') return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
  return pathname // 'preserve'
}

export function buildUrl(pathname: string, searchParams: URLSearchParams): string {
  const search = searchParams.toString()
  return search ? `${pathname}?${search}` : pathname
}

export function applyLocalePrefix(
  pathname: string,
  locale: LocaleCode,
  localeConfig: PageContextLocaleConfig,
  options?: LocalizedPathOptions,
  trailingSlash: TrailingSlash = 'never',
): string {
  const normalized = normalizePathname(pathname)
  const targetLocaleConfig = localeConfig.locales[locale]

  if (!targetLocaleConfig) {
    throw new Error(`[vike-i18n] Unknown locale: "${locale}"`)
  }

  if (options?.prefix === false || (options?.prefix === undefined && locale === localeConfig.defaultLocale && !localeConfig.prefixDefaultLocale)) {
    return applyTrailingSlash(normalized, trailingSlash)
  }

  const prefix = `/${targetLocaleConfig.urlPrefix}`
  const prefixed = normalized === '/' ? prefix : `${prefix}${normalized}`
  return applyTrailingSlash(prefixed, trailingSlash)
}

export function buildLocalizedUrl(
  pathname: string,
  searchParams: URLSearchParams,
  locale: LocaleCode,
  localeConfig: PageContextLocaleConfig,
  trailingSlash: TrailingSlash = 'never',
): string {
  return buildUrl(
    applyLocalePrefix(pathname, locale, localeConfig, undefined, trailingSlash),
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
