import type { PageContext } from 'vike/types'
import { createSetCookieHeader, resolveCookieAction } from '../core/cookies'

// Vike render hook that persists the resolved locale in a cookie.
export function onBeforeRender(pageContext: PageContext) {
  const i18n = pageContext.config.i18n
  const locale = pageContext.locale

  if (!i18n || !locale) return

  const cookieAction = resolveCookieAction(locale, i18n)
  if (!cookieAction) return

  pageContext.headersResponse?.append('Set-Cookie', createSetCookieHeader(cookieAction))
}
