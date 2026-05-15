import type { PageContext } from 'vike/types'
import { findSpecialityBySlug } from '../data'

export { data }

function data(pageContext: PageContext) {
  const requestedSlug = pageContext.routeParams.speciality
  const speciality = findSpecialityBySlug(requestedSlug)

  if (!speciality) {
    return {
      speciality: requestedSlug,
      title: requestedSlug,
      description: 'Unknown speciality',
    }
  }

  const locale = pageContext.locale ?? 'en'

  return {
    speciality: speciality.slug,
    title: speciality.title[locale as 'en' | 'ru'],
    description: speciality.description[locale as 'en' | 'ru'],
    variants: speciality.variants,
  }
}
