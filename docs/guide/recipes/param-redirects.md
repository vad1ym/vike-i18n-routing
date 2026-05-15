# Param Redirects

After loading entity data, register translated param variants and then check `redirectTo`.

```ts
import { redirect } from 'vike/abort'

const { setRouteParamVariants, routeConfig } = useI18nRoute(pageContext)

setRouteParamVariants('speciality', pageContext.data.variants.speciality)

if (routeConfig.redirectTo) {
  throw redirect(routeConfig.redirectTo)
}
```
