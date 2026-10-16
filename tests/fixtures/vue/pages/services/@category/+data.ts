import type { PageContext } from 'vike/types'
import { useI18nRoute } from 'vike-i18n-routing'

export { data }

function data(pageContext: PageContext) {
  const { setRouteParamVariants, setRouteQueryVariants } = useI18nRoute(pageContext)
  const url = new URL(pageContext.urlOriginal, 'http://localhost')
  const requestedFocus = url.searchParams.get('focus')

  setRouteParamVariants('category', {
    en: 'web-development',
    ru: 'veb-razrabotka',
  })

  if (requestedFocus) {
    setRouteQueryVariants('focus', {
      en: 'frontend',
      ru: 'frontend-ru',
    })
  }

  return {
    requestedFocus,
    currentUrl: pageContext.i18nRoute.currentLocaleUrl,
  }
}
