# Param Redirects

Register translated param variants inside `+data`. If the requested slug belongs to another locale, URL normalization happens automatically.

```ts
import type { PageContext } from 'vike/types'
import { useI18nRoute } from 'vike-i18n-routing'
import { loadItemFromDb } from '../data'

export { data }

function data(pageContext: PageContext) {
  const requestedSlug = pageContext.i18nRoute.routeConfig.i18nUrlParams.item
  const item = loadItemFromDb(requestedSlug)

  if (!item) return null

  const { setRouteParamVariants } = useI18nRoute(pageContext)

  setRouteParamVariants('item', item.slugVariants)

  return {
    itemId: item.id,
    slug: item.slug,
  }
}
```

No manual `redirectTo` check is needed in this flow.
