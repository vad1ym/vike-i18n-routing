import { createI18nRouter } from './router'
import { resolveDomainConfig } from './domain/normalize'
import type { DetectorContext, I18nConfig, LocaleCode } from './types'

type UrlOptions = {
  locale?: LocaleCode
  removeTrailingSlash?: boolean
  prefixDefaultLocale?: boolean
  prefixLocale?: boolean
  noPrefixLocale?: boolean
  context?: DetectorContext
}

// Creates a minimal detector context from a URL when no explicit context is provided.
function makeContext(url: string, context?: DetectorContext): DetectorContext {
  if (context) return context

  const parsed = new URL(url, 'http://localhost')

  return {
    url,
    pathname: parsed.pathname,
    headers: {},
    cookies: {},
    searchParams: parsed.searchParams,
  }
}

// Infers the active locale for a URL by running the route resolver.
function inferLocale(url: string, i18n: I18nConfig, context: DetectorContext): LocaleCode {
  const result = createI18nRouter(i18n).resolve(new URL(url, 'http://localhost').pathname, {
    context,
  })
  return result.locale
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
  i18n: I18nConfig,
  options?: Omit<UrlOptions, 'locale'>,
): string
export function toLocalizedUrl(
  url: string,
  i18n: I18nConfig,
  options?: UrlOptions,
): string
/**
 * Converts a route or URL to the localized URL for the target locale.
 *
 * If no locale is passed, locale is inferred from the current URL/context.
 */
export function toLocalizedUrl(
  url: string,
  localeOrI18n: LocaleCode | I18nConfig,
  i18nOrOptions?: I18nConfig | UrlOptions,
  maybeOptions?: Omit<UrlOptions, 'locale'>,
): string {
  const isLegacySignature = typeof localeOrI18n === 'string'
  const i18n = (isLegacySignature ? i18nOrOptions : localeOrI18n) as I18nConfig
  const options = (isLegacySignature ? maybeOptions : i18nOrOptions) as UrlOptions | undefined
  const context = makeContext(url, options?.context)
  const locale =
    (isLegacySignature ? localeOrI18n : options?.locale) ??
    inferLocale(url, i18n, context)
  const router = createI18nRouter(i18n)

  return withSlashOption(
    router.resolveLocalizedPath(url, locale, context, options),
    options?.removeTrailingSlash,
  )
}

/**
 * Converts any localized URL to the canonical URL for the default locale.
 */
export function toCanonicalUrl(
  url: string,
  i18n: I18nConfig,
  options?: Omit<UrlOptions, 'locale' | 'prefixLocale'>,
): string {
  const context = makeContext(url, options?.context)
  const router = createI18nRouter(i18n)
  const canonical = router.resolveCanonical(url, context)
  const defaultLocale = resolveDomainConfig(i18n, context).defaultLocale

  if (options?.noPrefixLocale) {
    return withSlashOption(canonical, options.removeTrailingSlash)
  }

  return withSlashOption(
    router.resolveLocalizedPath(canonical, defaultLocale, context, {
      prefixDefaultLocale: options?.prefixDefaultLocale,
      noPrefixLocale: false,
    }),
    options?.removeTrailingSlash,
  )
}

/**
 * Resolves any localized URL to the logical route URL used by route matching.
 */
export function toRouteUrl(
  url: string,
  i18n: I18nConfig,
  options?: { context?: DetectorContext },
): string {
  const context = makeContext(url, options?.context)
  return createI18nRouter(i18n).resolveCanonical(url, context)
}

/**
 * Returns alternate localized URLs for all locales available on the active domain.
 */
export function getAlternates(
  url: string,
  i18n: I18nConfig,
  options?: { context?: DetectorContext },
): { locale: LocaleCode; url: string }[] {
  const context = makeContext(url, options?.context)
  return createI18nRouter(i18n).getAlternates(url, context)
}
