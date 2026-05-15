import { redirect } from 'vike/abort'
import type { PageContext } from 'vike/types'
import { useI18nRoute } from 'vike-i18n-routing'

export { onData }

function onData(pageContext: PageContext<{ variants: { speciality: { en: string; ru: string } } }>) {
  if (!pageContext.data?.variants) return

  const { setRouteParamVariants, routeConfig } = useI18nRoute(pageContext)

  setRouteParamVariants('speciality', pageContext.data.variants.speciality)

  if (routeConfig.redirectTo) {
    throw redirect(routeConfig.redirectTo)
  }
}
