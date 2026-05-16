import { parseCookies } from './locale/detector'
import type { I18nConfig, I18nPageContext } from './types'

export function createPageContext(
  urlOriginal: string,
  pageContext?: Partial<I18nPageContext>,
): I18nPageContext {
  return {
    urlOriginal,
    config: pageContext?.config ?? {},
    headers: pageContext?.headers,
    session: pageContext?.session,
    domain: pageContext?.domain,
  }
}

export function getRequestUrl(pageContext: I18nPageContext): string {
  return pageContext.urlOriginal
}

export function getI18nConfig(pageContext: I18nPageContext): I18nConfig {
  const i18n = pageContext.config.i18n
  if (!i18n) {
    throw new Error('[vike-i18n] Missing config.i18n')
  }
  return i18n
}

export function getParsedUrl(pageContext: I18nPageContext): URL {
  return new URL(getRequestUrl(pageContext), 'http://localhost')
}

export function getPathname(pageContext: I18nPageContext): string {
  return getParsedUrl(pageContext).pathname
}

export function getHeaders(pageContext: I18nPageContext): Record<string, string | string[] | undefined> {
  return pageContext.headers ?? {}
}

export function getCookies(pageContext: I18nPageContext): Record<string, string> {
  const headers = getHeaders(pageContext)
  return parseCookies(typeof headers.cookie === 'string' ? headers.cookie : '')
}

export function getSearchParams(pageContext: I18nPageContext): URLSearchParams {
  return getParsedUrl(pageContext).searchParams
}

export function getSession(pageContext: I18nPageContext): Record<string, string | undefined> | undefined {
  return pageContext.session
}

export function getDomain(pageContext: I18nPageContext): string | undefined {
  if (pageContext.domain) return pageContext.domain.toLowerCase()

  const headers = getHeaders(pageContext)
  const hostHeader = headers.host
  const host = Array.isArray(hostHeader) ? hostHeader[0] : hostHeader

  if (host) return host.split(':')[0].toLowerCase()

  try {
    return getParsedUrl(pageContext).hostname.toLowerCase() || undefined
  } catch {
    return undefined
  }
}
