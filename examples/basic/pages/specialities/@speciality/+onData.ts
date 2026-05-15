import { redirect } from 'vike/abort'
import type { PageContext } from 'vike/types'

export { onData }

function onData(pageContext: PageContext<{ variants: { speciality: { en: string; ru: string } } }>) {
  const specialityVariants = pageContext.data.variants.speciality


  if (!pageContext.data) return

  pageContext.i18nRoute.setRouteParamVariants('speciality', specialityVariants)

  if (pageContext.i18nRoute.routeConfig.redirectTo) {
    throw redirect(pageContext.i18nRoute.routeConfig.redirectTo)
  }
}
