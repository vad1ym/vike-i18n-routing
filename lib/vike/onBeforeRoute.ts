import type { PageContextServer } from 'vike/types'
import { createI18nRouter } from '../core/router'

// Vike route hook that resolves locale-aware routing before page matching.
export function onBeforeRoute(pageContext: PageContextServer) {
  // When vike re-renders after `throw render(url)`, _urlRewrite holds the rewrite target
  // while urlOriginal still points to the original browser URL. Using urlOriginal would
  // re-trigger alias resolution and cause an infinite loop, so we prefer _urlRewrite.
  const urlToRoute = (pageContext as any)._urlRewrite ?? pageContext.urlOriginal
  const i18nRoute = createI18nRouter(urlToRoute, pageContext as any)

  return {
    pageContext: {
      urlLogical: i18nRoute.routeConfig.canonicalUrl,
      locale: i18nRoute.localeConfig.currentLocale,
      i18nRoute,
    } as Partial<Vike.PageContext>,
  }
}
