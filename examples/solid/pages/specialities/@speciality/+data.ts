import type { PageContext } from 'vike/types'
import { useI18nRoute } from 'vike-i18n-routing'
import { findSpecialityBySlug } from '../data'

export { data }

function data(pageContext: PageContext) {
  const requestedSlug = pageContext.i18nRoute.params.speciality
  const speciality = findSpecialityBySlug(requestedSlug)

  if (!speciality) {
    return {
      speciality: requestedSlug,
      title: requestedSlug,
      description: 'Unknown speciality',
    }
  }

  const locale = (pageContext.locale ?? 'en') as 'en' | 'ru'
  const { setRouteParamVariants } = useI18nRoute(pageContext)
  setRouteParamVariants('speciality', speciality.variants.speciality)

  return {
    speciality: speciality.slug,
    title: speciality.title[locale],
    description: speciality.description[locale],
    variants: speciality.variants,
  }
}
