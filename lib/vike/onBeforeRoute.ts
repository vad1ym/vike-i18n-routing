import { redirect } from 'vike/abort'
import type { PageContextServer } from 'vike/types'
import { getPathname } from '../core/pageContext'
import { createI18nRouter } from '../core/router'

// Vike route hook that resolves locale-aware routing before page matching.
export function onBeforeRoute(pageContext: PageContextServer) {
  const result = createI18nRouter(pageContext as any).resolve(getPathname(pageContext as any))

  if (result.redirectTo) {
    throw redirect(result.redirectTo)
  }

  return {
    pageContext: {
      locale: result.i18nRoute.localeConfig.currentLocale,
      i18nRoute: result.i18nRoute,
    } as Partial<Vike.PageContext>,
  }
}
