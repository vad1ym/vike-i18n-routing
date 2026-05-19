import { getCookies, getHeaders, getSearchParams, getSession } from '../pageContext'
import { resolveDomainConfig } from '../domain/normalize'
import type { I18nConfig, I18nPageContext, LocaleCode, LocaleDetectorConfig, ResolvedDomainConfig } from '../types'

type LocaleDetectionTrace = {
  source: string
  matched: boolean
  detail: string
}

type ImportMetaEnvLike = {
  DEV?: boolean
  MODE?: string
}

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

function isSupportedLocale(
  candidate: string | null | undefined,
  resolvedDomain: ResolvedDomainConfig,
): candidate is LocaleCode {
  return !!candidate && !!resolvedDomain.locales[candidate]
}

function pushTrace(
  traces: LocaleDetectionTrace[] | undefined,
  source: string,
  matched: boolean,
  detail: string,
): void {
  traces?.push({ source, matched, detail })
}

function emitLocaleDebugLog(
  i18n: I18nConfig,
  locale: LocaleCode,
  traces: LocaleDetectionTrace[] | undefined,
): void {
  if (!traces) return

  console.info(`[vike-i18n-routing] locale resolved: ${locale}`)
  for (const trace of traces) {
    console.info(`[vike-i18n-routing]   ${trace.matched ? '✓' : '✗'} ${trace.source} -> ${trace.detail}`)
  }
}

function isLocaleDebugEnabled(i18n: I18nConfig): boolean {
  if (i18n.debug !== undefined) return i18n.debug

  const env = (import.meta as ImportMeta & { env?: ImportMetaEnvLike }).env
  return env?.DEV === true && env.MODE !== 'test'
}

// Resolves the best locale for an unprefixed request.
export function detectRequestLocale(
  pageContext: I18nPageContext,
  i18n: I18nConfig,
  preResolved?: ResolvedDomainConfig,
): LocaleCode {
  const resolvedDomain = preResolved ?? resolveDomainConfig(i18n, pageContext)
  const locales = resolvedDomain.locales
  const traces = isLocaleDebugEnabled(i18n) ? [] as LocaleDetectionTrace[] : undefined

  const detectorConfig = getLocaleDetectorConfig(i18n)

  let candidate: string | null | undefined

  if (typeof i18n.localeDetector === 'function') {
    candidate = i18n.localeDetector(pageContext)
    if (isSupportedLocale(candidate, resolvedDomain)) {
      pushTrace(traces, 'localeDetector fn', true, `'${candidate}'`)
      emitLocaleDebugLog(i18n, candidate, traces)
      return candidate
    }
    pushTrace(traces, 'localeDetector fn', false, candidate == null ? 'null' : `unsupported locale '${candidate}'`)
  } else {
    pushTrace(traces, 'localeDetector fn', false, 'not configured')
  }

  const searchParams = getSearchParams(pageContext)
  if (detectorConfig.queryParams !== false) {
    candidate = searchParams.get('locale')
    if (isSupportedLocale(candidate, resolvedDomain)) {
      pushTrace(traces, 'query ?locale', true, `'${candidate}'`)
      emitLocaleDebugLog(i18n, candidate, traces)
      return candidate
    }
    pushTrace(
      traces,
      'query ?locale',
      false,
      candidate == null ? 'not present' : `unsupported locale '${candidate}'`,
    )

    candidate = searchParams.get('lang')
    if (isSupportedLocale(candidate, resolvedDomain)) {
      pushTrace(traces, 'query ?lang', true, `'${candidate}'`)
      emitLocaleDebugLog(i18n, candidate, traces)
      return candidate
    }
    pushTrace(
      traces,
      'query ?lang',
      false,
      candidate == null ? 'not present' : `unsupported locale '${candidate}'`,
    )
  } else {
    pushTrace(traces, 'query params', false, 'disabled')
  }

  if (detectorConfig.localeCookie !== false) {
    candidate = resolveCookieLocale(pageContext, i18n)
    const cookieName = i18n.localeCookie ?? 'i18n-locale'
    if (isSupportedLocale(candidate, resolvedDomain)) {
      pushTrace(traces, `cookie '${cookieName}'`, true, `'${candidate}'`)
      emitLocaleDebugLog(i18n, candidate, traces)
      return candidate
    }
    pushTrace(
      traces,
      `cookie '${cookieName}'`,
      false,
      candidate == null ? 'not present' : `unsupported locale '${candidate}'`,
    )
  } else {
    pushTrace(traces, 'locale cookie', false, 'disabled')
  }

  if (detectorConfig.session !== false) {
    candidate = getSession(pageContext)?.locale
    if (isSupportedLocale(candidate, resolvedDomain)) {
      pushTrace(traces, 'session.locale', true, `'${candidate}'`)
      emitLocaleDebugLog(i18n, candidate, traces)
      return candidate
    }
    pushTrace(
      traces,
      'session.locale',
      false,
      candidate == null ? 'not present' : `unsupported locale '${candidate}'`,
    )
  } else {
    pushTrace(traces, 'session.locale', false, 'disabled')
  }

  if (detectorConfig.acceptLanguageHeader !== false) {
    const acceptLanguage = getHeaders(pageContext)['accept-language']
    const headerValue = Array.isArray(acceptLanguage) ? acceptLanguage[0] : acceptLanguage
    const parsed = parseAcceptLanguage(headerValue)
    for (const lang of parsed) {
      if (locales[lang]) {
        pushTrace(traces, 'accept-language header', true, `'${lang}'`)
        emitLocaleDebugLog(i18n, lang, traces)
        return lang
      }
    }
    pushTrace(
      traces,
      'accept-language header',
      false,
      !headerValue ? 'not present' : `no supported locale in '${parsed.join(', ')}'`,
    )
  } else {
    pushTrace(traces, 'accept-language header', false, 'disabled')
  }

  pushTrace(traces, 'default locale', true, `'${resolvedDomain.defaultLocale}'`)
  emitLocaleDebugLog(i18n, resolvedDomain.defaultLocale, traces)
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
