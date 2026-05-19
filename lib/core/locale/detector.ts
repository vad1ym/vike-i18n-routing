import { getCookies, getHeaders, getSearchParams, getSession } from '../pageContext'
import { resolveDomainConfig } from '../domain/normalize'
import type { I18nConfig, I18nPageContext, LocaleCode, LocaleDetectorConfig, ResolvedDomainConfig } from '../types'

// Parses a Cookie header string into a name/value map.
export function parseCookies(cookieHeader: string): Record<string, string> {
  return Object.fromEntries(
    cookieHeader
      .split(';')
      .map((part) => part.trim().split('='))
      .filter(([key]) => key)
      .map(([key, ...rest]) => [key.trim(), decodeURIComponent(rest.join('=').trim())]),
  )
}

// Parses Accept-Language into locale candidates ordered by quality value.
function parseAcceptLanguage(header: string | undefined): string[] {
  if (!header) return []

  return header
    .split(',')
    .map((part) => {
      const [tag, qValue] = part.trim().split(';q=')
      return {
        locale: tag.toLowerCase(),
        weight: qValue ? Number(qValue) : 1,
      }
    })
    .filter((item) => item.locale)
    .sort((a, b) => b.weight - a.weight)
    .flatMap((item) => {
      const base = item.locale.split('-')[0]
      return base && base !== item.locale ? [item.locale, base] : [item.locale]
    })
}

// Reads the configured locale cookie from the request context.
export function resolveCookieLocale(
  pageContext: I18nPageContext,
  i18n: I18nConfig,
): string | undefined {
  if (i18n.localeCookie === false) return undefined
  const cookieName = i18n.localeCookie ?? 'i18n-locale'
  return getCookies(pageContext)[cookieName]
}

// Resolves the best locale for an unprefixed request.
export function detectRequestLocale(
  pageContext: I18nPageContext,
  i18n: I18nConfig,
  preResolved?: ResolvedDomainConfig,
): LocaleCode {
  const resolvedDomain = preResolved ?? resolveDomainConfig(i18n, pageContext)
  const locales = resolvedDomain.locales

  const detectorConfig = getLocaleDetectorConfig(i18n)

  let candidate: string | null | undefined

  if (typeof i18n.localeDetector === 'function') {
    candidate = i18n.localeDetector(pageContext)
    if (candidate && locales[candidate]) return candidate
  }

  const searchParams = getSearchParams(pageContext)
  if (detectorConfig.queryParams !== false) {
    candidate = searchParams.get('locale')
    if (candidate && locales[candidate]) return candidate
    candidate = searchParams.get('lang')
    if (candidate && locales[candidate]) return candidate
  }

  if (detectorConfig.localeCookie !== false) {
    candidate = resolveCookieLocale(pageContext, i18n)
    if (candidate && locales[candidate]) return candidate
  }

  if (detectorConfig.session !== false) {
    candidate = getSession(pageContext)?.locale
    if (candidate && locales[candidate]) return candidate
  }

  if (detectorConfig.acceptLanguageHeader !== false) {
    const acceptLanguage = getHeaders(pageContext)['accept-language']
    const headerValue = Array.isArray(acceptLanguage) ? acceptLanguage[0] : acceptLanguage
    const parsed = parseAcceptLanguage(headerValue)
    for (const lang of parsed) {
      if (locales[lang]) return lang
    }
  }

  return resolvedDomain.defaultLocale
}

const localeDetectorConfigCache = new WeakMap<I18nConfig, LocaleDetectorConfig>()

function getLocaleDetectorConfig(i18n: I18nConfig): LocaleDetectorConfig {
  let config = localeDetectorConfigCache.get(i18n)
  if (!config) {
    config = typeof i18n.localeDetector === 'function' ? {} : (i18n.localeDetector ?? {})
    localeDetectorConfigCache.set(i18n, config)
  }
  return config
}
