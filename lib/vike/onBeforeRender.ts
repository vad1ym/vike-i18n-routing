import type { PageContext } from 'vike/types'

// Passes runtime variants (set by +data via setRouteParamVariants/setRouteQueryVariants) to the client.
export function onBeforeRender(pageContext: PageContext) {
  return {
    pageContext: {
      i18nParamVariants: pageContext.i18nRoute.paramVariants,
      i18nQueryVariants: pageContext.i18nRoute.queryVariants,
    } as Partial<Vike.PageContext>,
  }
}
