import type { PageContextServer } from 'vike/types'
import { redirect } from 'vike/abort'
import { createI18nRouter } from '../core/router'
import { createSetCookieHeader, resolveCookieAction } from '../core/cookies'
import type { I18nRoute } from '../core/types'

// Vike route hook that resolves locale-aware routing before page matching.
export function onBeforeRoute(pageContext: PageContextServer) {
  const i18nRoute = createI18nRouter(pageContext.urlOriginal, pageContext as any)

  if (i18nRoute.redirectTo) {
    setLocaleCookieOnRedirect(pageContext, i18nRoute)
    throw redirect(i18nRoute.redirectTo, i18nRoute.redirectStatus as 301 | 302 | undefined)
  }

  return {
    pageContext: {
      urlLogical: i18nRoute.logicalUrl,
      locale: i18nRoute.locale,
      i18nRoute,
    } as Partial<Vike.PageContext>,
  }
}

// Persists the locale of the redirect target. Vike keeps Set-Cookie headers set before
// `throw redirect()` on the redirect response (also for .pageContext.json responses).
function setLocaleCookieOnRedirect(pageContext: PageContextServer, i18nRoute: I18nRoute) {
  if (pageContext.isClientSide) return

  const i18n = pageContext.config.i18n
  if (!i18n) return

  const cookieAction = resolveCookieAction(i18nRoute.locale, i18n)
  if (!cookieAction) return

  const headers = pageContext.headersResponse ?? new Headers()
  headers.append('Set-Cookie', createSetCookieHeader(cookieAction))
  ;(pageContext as { headersResponse: Headers }).headersResponse = headers
}
