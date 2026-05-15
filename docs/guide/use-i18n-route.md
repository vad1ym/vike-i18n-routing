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

## Difference between native and framework exports

Use `'vike-i18n-routing'` when you have a plain `pageContext`.

Use `'vike-i18n-routing/vue'` when you want Vue-friendly computed values in components.

Use `'vike-i18n-routing/react'` when you want React-friendly memoized values in components.

## `localizePath()` signatures

```ts
localizePath(routeKey)
localizePath(routeKey, locale)
localizePath(routeKey, options)
localizePath(routeKey, locale, options)
```

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
