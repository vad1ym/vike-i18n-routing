import { normalizePathname } from './route-patterns'
import type { LocaleCode, LocalizedPathOptions, PageContextLocaleConfig, TrailingSlash } from './types'

// File extensions vike knows a Content-Type for (https://vike.dev/pageContext#content).
// A URL ending with one of them (e.g. /feed.atom) is a file URL and never gets a trailing slash,
// mirroring vike's own URL normalization (https://vike.dev/url-normalization).
const FILE_EXTENSIONS = new Set([
  'atom', 'rss', 'xml', 'json', 'jsonld', 'webmanifest',
  'txt', 'md', 'csv', 'ics', 'html', 'htm', 'css', 'js', 'mjs',
  'svg', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'ico', 'pdf',
])

export function isFileUrl(pathname: string): boolean {
  const end = pathname.endsWith('/') ? pathname.length - 1 : pathname.length
  const fileName = pathname.slice(pathname.lastIndexOf('/', end - 1) + 1, end)
  const dot = fileName.lastIndexOf('.')
  if (dot <= 0) return false
  return FILE_EXTENSIONS.has(fileName.slice(dot + 1).toLowerCase())
}

// 'always' never applies to file URLs
export function resolveTrailingSlashMode(pathname: string, mode: TrailingSlash): TrailingSlash {
  return mode === 'always' && isFileUrl(pathname) ? 'never' : mode
}

export function applyTrailingSlash(pathname: string, mode: TrailingSlash): string {
  if (pathname === '/') return '/'
  mode = resolveTrailingSlashMode(pathname, mode)
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

