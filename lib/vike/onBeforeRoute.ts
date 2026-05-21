import type { PageContextServer } from 'vike/types'
import { redirect } from 'vike/abort'
import { createI18nRouter } from '../core/router'

// Vike route hook that resolves locale-aware routing before page matching.
export function onBeforeRoute(pageContext: PageContextServer) {
  const i18nRoute = createI18nRouter(pageContext.urlOriginal, pageContext as any)

  if (i18nRoute.redirectTo) {
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
