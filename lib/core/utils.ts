import { createI18nRouter } from './router'
import type { I18nPageContext, LocaleCode } from './types'

type UrlOptions = {
  locale?: LocaleCode
  removeTrailingSlash?: boolean
  prefixDefaultLocale?: boolean
  prefixLocale?: boolean
  noPrefixLocale?: boolean
}

// Infers the active locale for a URL by running the route resolver.
function inferLocale(url: string, pageContext: I18nPageContext): LocaleCode {
  const result = createI18nRouter(pageContext).resolve(new URL(url, 'http://localhost').pathname)
  return result.i18nRoute.localeConfig.currentLocale
}

// Removes a trailing slash from a URL unless the URL is root.
function stripTrailingSlash(url: string): string {
  return url !== '/' ? url.replace(/\/+$/, '') : url
}

// Applies the trailing-slash option to a generated URL.
function withSlashOption(url: string, removeTrailingSlash?: boolean): string {
  return removeTrailingSlash ? stripTrailingSlash(url) : url
}

export function toLocalizedUrl(
  url: string,
  locale: LocaleCode,
  pageContext: I18nPageContext,
  options?: Omit<UrlOptions, 'locale'>,
): string
export function toLocalizedUrl(
  url: string,
  pageContext: I18nPageContext,
  options?: UrlOptions,
): string
/**
 * Converts a route or URL to the localized URL for the target locale.
 *
 * If no locale is passed, locale is inferred from the current URL/context.
 */
export function toLocalizedUrl(
  url: string,
  localeOrPageContext: LocaleCode | I18nPageContext,
  pageContextOrOptions?: I18nPageContext | UrlOptions,
  maybeOptions?: Omit<UrlOptions, 'locale'>,
): string {
  const hasExplicitLocale = typeof localeOrPageContext === 'string'
  const pageContext = (hasExplicitLocale ? pageContextOrOptions : localeOrPageContext) as I18nPageContext
  const options = (hasExplicitLocale ? maybeOptions : pageContextOrOptions) as UrlOptions | undefined
  const locale =
    (hasExplicitLocale ? localeOrPageContext : options?.locale) ??
    inferLocale(url, pageContext)
  const router = createI18nRouter(pageContext)

  return withSlashOption(
    router.resolveLocalizedPath(url, locale, options),
    options?.removeTrailingSlash,
  )
}

/**
 * Returns alternate localized URLs for all locales available on the active domain.
 */
export function getAlternates(
  url: string,
  pageContext: I18nPageContext,
): { locale: LocaleCode; url: string }[] {
  return createI18nRouter(pageContext).resolve(url).i18nRoute.routeConfig.alternateUrls
}
