import type { PageContext } from 'vike/types'
import { createSetCookieHeader, resolveCookieAction } from '../core/cookies'
import { redirect } from 'vike/abort'

// Vike render hook that persists the resolved locale in a cookie.
export function onBeforeRender(pageContext: PageContext) {
  const i18n = pageContext.config.i18n
  const locale = pageContext.locale

  if (pageContext.i18nRoute?.routeConfig?.redirectTo) {
    throw redirect(pageContext.i18nRoute.routeConfig.redirectTo)
  }

  if (!i18n || !locale) return

  const cookieAction = resolveCookieAction(locale, i18n)
  if (cookieAction) {
    pageContext.headersResponse?.append('Set-Cookie', createSetCookieHeader(cookieAction))
  }

  return {
    pageContext: {
      i18nParamVariants: pageContext.i18nRoute.routeConfig.paramVariants,
    } as Partial<Vike.PageContext>,
  }
}
