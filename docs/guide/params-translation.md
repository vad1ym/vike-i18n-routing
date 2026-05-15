# Params Translation

Localized route patterns and translated param values are separate concerns.

## Localized route pattern

```ts
// +config
routes: {
  '/services/:category{/:tab}': {
    en: '/services/:category{/:tab}',
    ru: '/uslugi/:category{/:tab}',
    fr: '/services-fr/:category{/:tab}',
  },
}
```

This translates the route shape, but not the actual param value.

## Param variants

If the param itself changes by locale, register variants at runtime.

```ts
const { setRouteParamVariants } = useI18nRoute(pageContext)

setRouteParamVariants('category', {
  en: 'web-development',
  ru: 'veb-razrabotka',
  fr: 'developpement-web',
})
```

## Why it matters

After variants are registered, the router can:

- resolve a localized slug to a canonical value
- build the correct slug for another locale
- redirect a foreign slug to the current locale slug

Example:

- request `/ru/uslugi/veb-razrabotka`
- canonical route becomes `/services/web-development`
- `localizePath('/services/web-development', 'fr')` returns `/services-fr/developpement-web`

## Typical hook flow

```ts
import { redirect } from 'vike/abort'
import { useI18nRoute } from 'vike-i18n-routing'

export function onData(pageContext: Vike.PageContext<{ variants?: { speciality: Record<string, string> } }>) {
  if (!pageContext.data?.variants) return

  const { setRouteParamVariants, routeConfig } = useI18nRoute(pageContext)

  setRouteParamVariants('speciality', pageContext.data.variants.speciality)

  if (routeConfig.redirectTo) {
    throw redirect(routeConfig.redirectTo)
  }
}
```

Next: [useI18nRoute](/guide/use-i18n-route)
