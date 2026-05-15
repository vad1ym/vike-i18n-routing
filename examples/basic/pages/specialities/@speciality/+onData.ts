import { redirect } from 'vike/abort'
import type { PageContext } from 'vike/types'
import { findSpecialityBySlug } from '../data'

export { onData }

function onData(pageContext: PageContext) {
  const requestedSlug = pageContext.routeParams.speciality
  const speciality = findSpecialityBySlug(requestedSlug)

  if (!speciality) return

  pageContext.i18nRoute.setRouteParamVariants(
    'speciality',
    speciality.variants.speciality,
    { redirect: true },
  )

  if (pageContext.i18nRoute.routeConfig.redirectTo) {
    throw redirect(pageContext.i18nRoute.routeConfig.redirectTo)
  }
}
