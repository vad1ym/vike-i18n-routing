import type { PageContextServer } from 'vike/types'
import { createSetCookieHeader, resolveCookieAction } from '../core/cookies'

// Persists the resolved locale in a cookie on every rendered page.
// `headersResponse` is cumulative, so it doesn't collide with the app's own headers.
export function headersResponse(pageContext: PageContextServer): Record<string, string> {
  const i18n = pageContext.config.i18n
  const locale = pageContext.locale

  if (!i18n || !locale) return {}

  const cookieAction = resolveCookieAction(locale, i18n)
  if (!cookieAction) return {}

  return { 'Set-Cookie': createSetCookieHeader(cookieAction) }
}
