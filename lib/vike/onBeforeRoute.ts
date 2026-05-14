import { redirect } from 'vike/abort'
import type { PageContextServer } from 'vike/types'
import { createI18nRouter } from '../core/router'

// Vike route hook that resolves locale-aware routing before page matching.
export function onBeforeRoute(pageContext: PageContextServer) {
  const i18nRoute = createI18nRouter(pageContext.urlPathname, pageContext as any)

  if (i18nRoute.routeConfig.redirectTo) {
    throw redirect(i18nRoute.routeConfig.redirectTo)
  }

  return {
    pageContext: {
      urlLogical: i18nRoute.routeConfig.vikeUrl,
      locale: i18nRoute.localeConfig.currentLocale,
      i18nRoute,
    } as Partial<Vike.PageContext>,
  }
}
