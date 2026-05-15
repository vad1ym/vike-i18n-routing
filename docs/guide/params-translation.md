# Params Translation

Localized route patterns and translated param values are separate concerns.

## Route param syntax

Use `@paramName` to declare dynamic segments:

```ts
'/services/@category/@slug'
```

This is the preferred syntax. `@` is an alias for `:` — under the hood the pattern is passed to [path-to-regexp](https://github.com/pillarjs/path-to-regexp), so all its syntax works too:

```ts
'/services/:category/:slug'    // same as above
'/services/@category{/@tab}'   // optional segment
'/files/@path*'                // zero or more segments
```

## Localized route pattern

```ts
// +config
routes: {
  '/services/@category{/@tab}': {
    en: '/services/@category{/@tab}',
    ru: '/uslugi/@category{/@tab}',
    fr: '/services-fr/@category{/@tab}',
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
- normalize a foreign slug to the current locale slug automatically

Example:

- request `/ru/uslugi/veb-razrabotka`
- canonical route becomes `/services/web-development`
- `localizePath('/services/web-development', 'fr')` returns `/services-fr/developpement-web`

## Typical `+data` flow

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

When `setRouteParamVariants()` changes the normalized route, the redirect is handled automatically.

## Query variants

Use `setRouteQueryVariants()` when a query-string value also has locale-specific variants.

```ts
const { setRouteQueryVariants } = useI18nRoute(pageContext)

setRouteQueryVariants('focus', {
  en: 'frontend',
  ru: 'frontend-ru',
})
```

After registration, the router can:

- canonicalize `?focus=frontend-ru` to `?focus=frontend`
- localize the active filter when switching locale
- redirect a foreign query value to the current locale automatically

This fits filter-link pages especially well.

Next: [useI18nRoute](/guide/use-i18n-route)
