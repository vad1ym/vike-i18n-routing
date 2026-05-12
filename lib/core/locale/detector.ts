import { resolveDomainConfig } from '../domain/normalize'
import { normalizeLocales } from './normalize'
import type { DetectorContext, I18nConfig, LocaleCode } from '../types'

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
function resolveCookieLocale(context: DetectorContext, i18n: I18nConfig): string | undefined {
  if (i18n.localeCookie === false) return undefined
  const cookieName = i18n.localeCookie ?? 'i18n-locale'
  return context.cookies[cookieName]
}

// Resolves the best locale for an unprefixed request.
export function runLocaleDetector(
  context: DetectorContext,
  i18n: I18nConfig,
): LocaleCode {
  const resolvedDomain = resolveDomainConfig(i18n, context)
  const locales = normalizeLocales(resolvedDomain.locales)

  const validate = (locale: string | null | undefined): LocaleCode | null => {
    if (locale && locales[locale]) return locale
    return null
  }

  const candidates: Array<string | null | undefined> = []

  if (i18n.localeDetector) {
    candidates.push(i18n.localeDetector(context))
  }

  candidates.push(
    context.searchParams.get('locale'),
    context.searchParams.get('lang'),
    resolveCookieLocale(context, i18n),
    context.session?.locale,
  )

  const acceptLanguage = context.headers['accept-language']
  const headerValue = Array.isArray(acceptLanguage) ? acceptLanguage[0] : acceptLanguage
  candidates.push(...parseAcceptLanguage(headerValue))

  for (const candidate of candidates) {
    const detected = validate(candidate)
    if (detected) return detected
  }

  return resolvedDomain.defaultLocale
}
