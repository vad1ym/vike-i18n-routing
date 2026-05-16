# useI18nRoute

`useI18nRoute()` is the main runtime API.

## Root export

Use the root export when you already have `pageContext` in a hook, loader, or server-side handler.

```ts
import { useI18nRoute } from 'vike-i18n-routing'

const {
  locale,
  localeConfig,
  domainConfig,
  routeConfig,
  setRouteParamVariants,
  setRouteQueryVariants,
  localizePath,
} = useI18nRoute(pageContext)
```

`locale`, `localeConfig`, `domainConfig`, and `routeConfig` are plain getters on the returned object.

## Vue export

Use the Vue export in components.

```ts
import { usePageContext } from 'vike-vue/usePageContext'
import { useI18nRoute } from 'vike-i18n-routing/vue'

const pageContext = usePageContext()
const { locale, localeConfig, domainConfig, routeConfig, localizePath } = useI18nRoute(pageContext)
```

In the Vue version:

- `locale` is a computed ref
- `localeConfig` is a computed ref
- `domainConfig` is a computed ref
- `routeConfig` is a computed ref

`setRouteParamVariants()`, `setRouteQueryVariants()`, and `localizePath()` keep the same API shape.

When `setRouteParamVariants()` is used during data loading, translated-param redirects are applied automatically.
When `setRouteQueryVariants()` is used during data loading, translated query values are normalized automatically too.

## React export

Use the React export in components.

```ts
import { usePageContext } from 'vike-react/usePageContext'
import { useI18nRoute } from 'vike-i18n-routing/react'

const pageContext = usePageContext()
const { locale, localeConfig, domainConfig, routeConfig, localizePath } = useI18nRoute(pageContext)
```

In the React version:

- `locale` is a plain value
- `localeConfig` is a memoized object
- `domainConfig` is a memoized object
- `routeConfig` is a memoized object

`setRouteParamVariants()`, `setRouteQueryVariants()`, and `localizePath()` keep the same API shape.

## Solid export

Use the Solid export in components.

```ts
import { usePageContext } from 'vike-solid/usePageContext'
import { useI18nRoute } from 'vike-i18n-routing/solid'

const pageContext = usePageContext()
const { locale, localeConfig, domainConfig, routeConfig, localizePath } = useI18nRoute(pageContext)
```

In the Solid version:

- `locale` is a memo accessor
- `localeConfig` is a memo accessor
- `domainConfig` is a memo accessor
- `routeConfig` is a memo accessor

`setRouteParamVariants()`, `setRouteQueryVariants()`, and `localizePath()` keep the same API shape.

## `localizePath()` signatures

```ts
localizePath(routeKey)
localizePath(routeKey, locale)
localizePath(routeKey, options)
localizePath(routeKey, locale, options)
```

### Options

```ts
type LocalizedPathOptions = {
  prefix?: boolean                                     // force-include or exclude the locale prefix
  params?: Record<string, string>                      // interpolated into the route pattern before localization
  query?: Record<string, string>                       // appended as search string, values localized via queryVariants
  paramVariants?: Record<string, RouteParamVariants>   // inline param variants, scoped to this call
  queryVariants?: Record<string, RouteQueryVariants>   // inline query variants, scoped to this call
}
```

### `params`

Interpolate named route params directly in `localizePath` without pre-building the URL:

```ts
localizePath('/services/:item', 'ru', { params: { item: 'web-development' } })
// → '/ru/uslugi/web-development'
```

Param values are filled into the pattern, then the resulting path goes through the normal localization pipeline (param variants, locale prefix).

### `query`

Append query string parameters. Values registered via `setRouteQueryVariants` are automatically localized for the target locale:

```ts
localizePath('/about', 'ru', { query: { ref: 'banner' } })
// → '/ru/o-nas?ref=banner'

// with setRouteQueryVariants('focus', { en: 'frontend', ru: 'frontend-ru' })
localizePath('/about', 'ru', { query: { focus: 'frontend' } })
// → '/ru/o-nas?focus=frontend-ru'
```

### `params` and `query` together

```ts
localizePath('/search/:type', 'ru', { params: { type: 'doctors' }, query: { page: '2' } })
// → '/ru/poisk/doctors?page=2'
```

### `paramVariants`

Pass slug variant maps inline for a single `localizePath` call, without registering them globally via `setRouteParamVariants`. Useful when building lists where each item has its own slug map:

```ts
localizePath('/services/:service', 'ru', {
  paramVariants: {
    service: { en: 'web-development', ru: 'veb-razrabotka' },
  },
})
// → '/ru/uslugi/veb-razrabotka'
```

The canonical value (defaultLocale variant) is used to fill the route pattern, then the target-locale variant is applied. Inline variants take precedence over globally registered ones for this call only — global state is not mutated.

### `queryVariants`

Pass query value variant maps inline:

```ts
localizePath('/about', 'ru', {
  query: { category: 'electronics' },
  queryVariants: {
    category: { en: 'electronics', ru: 'elektronika' },
  },
})
// → '/ru/o-nas?category=elektronika'
```

Inline `queryVariants` merge with globally registered ones for this call, with inline taking precedence.

## Return shape

```ts
type UseI18nRouteResult = {
  locale
  localeConfig
  domainConfig
  routeConfig
  setRouteParamVariants(paramName, variants)
  setRouteQueryVariants(paramName, variants)
  localizePath(routeKey, locale?, options?)
}
```

Next: [routeConfig](/guide/route-config)
