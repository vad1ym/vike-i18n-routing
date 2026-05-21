import type { PageContext } from 'vike/types'
import { findSpecialityBySlug } from '../data'
import { useI18nRoute } from 'vike-i18n-routing'

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
  
  const locale = pageContext.locale ?? 'en'
  
  const { setRouteParamVariants } = useI18nRoute(pageContext)
  setRouteParamVariants('speciality', speciality.variants.speciality)

  return {
    speciality: speciality.slug,
    title: speciality.title[locale as 'en' | 'ru'],
    description: speciality.description[locale as 'en' | 'ru'],
    variants: speciality.variants,
  }
}
