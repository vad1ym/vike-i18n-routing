import type { PageContext } from 'vike/types'
import { createSetCookieHeader, resolveCookieAction } from '../core/cookies'
import { redirect } from 'vike/abort'

// Vike render hook that persists the resolved locale in a cookie.
export function onBeforeRender(pageContext: PageContext) {
  const i18n = pageContext.config.i18n
  const locale = pageContext.locale

  if (pageContext.i18nRoute?.redirectTo) {
    // vike's redirect() type only accepts 301 | 302, but we support 307 | 308 as well.
    // The cast is safe: vike passes the status code through to the HTTP response as-is.
    throw redirect(
      pageContext.i18nRoute.redirectTo,
      pageContext.i18nRoute.redirectStatus as 301 | 302 | undefined,
    )
  }

  if (!i18n || !locale) return

  const cookieAction = resolveCookieAction(locale, i18n)
  if (cookieAction) {
    pageContext.headersResponse?.append('Set-Cookie', createSetCookieHeader(cookieAction))
  }

    return {
      pageContext: {
      i18nParamVariants: pageContext.i18nRoute.paramVariants,
      i18nQueryVariants: pageContext.i18nRoute.queryVariants,
    } as Partial<Vike.PageContext>,
  }
}
