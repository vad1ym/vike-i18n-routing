import type { PageContext } from 'vike/types'
import { useI18nRoute } from 'vike-i18n-routing'
import { findSpecialityFocusBySlug, specialities, specialityFocusFilters } from './data'

export { data }

function data(pageContext: PageContext) {
  const url = new URL(pageContext.urlOriginal, 'http://localhost')
  const requestedFocus = url.searchParams.get('focus')
  const resolvedFocus = findSpecialityFocusBySlug(requestedFocus)

  if (resolvedFocus) {
    const { setRouteQueryVariants } = useI18nRoute(pageContext)
    setRouteQueryVariants('focus', resolvedFocus.variants)
  }

  return {
    activeFocus: resolvedFocus?.key ?? null,
    filters: specialityFocusFilters,
    specialities: resolvedFocus
      ? specialities.filter((item) => item.focus === resolvedFocus.key)
      : specialities,
  }
}
