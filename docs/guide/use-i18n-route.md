# useI18nRoute

`useI18nRoute()` is the main runtime API. Import it from `vike-i18n-routing` and pass `pageContext` directly.

```ts
import { useI18nRoute } from 'vike-i18n-routing'

const {
  locale,
  localeConfig,
  domainConfig,
  routeConfig,
  setRouteParamVariants,
  setRouteQueryVariants,
  resolveRouteKey,
  localizePath,
} = useI18nRoute(pageContext)
```

`locale`, `localeConfig`, `domainConfig`, and `routeConfig` are plain getters on the returned object.

## In components

Get `pageContext` from your framework's hook and pass it directly:

**Vue:**

```ts
import { usePageContext } from 'vike-vue/usePageContext'
import { useI18nRoute } from 'vike-i18n-routing'

const { i18nRoute, localizePath } = useI18nRoute(usePageContext())
```

**React:**

```ts
import { usePageContext } from 'vike-react/usePageContext'
import { useI18nRoute } from 'vike-i18n-routing'

const { i18nRoute, localizePath } = useI18nRoute(usePageContext())
```

**Solid:**

```ts
import { usePageContext } from 'vike-solid/usePageContext'
import { useI18nRoute } from 'vike-i18n-routing'

const { i18nRoute, localizePath } = useI18nRoute(usePageContext())
```

When `setRouteParamVariants()` is used during data loading, translated-param redirects are applied automatically.
When `setRouteQueryVariants()` is used during data loading, translated query values are normalized automatically too.

## `localizePath()` signatures

```ts
localizePath(routeKey)
localizePath(routeKey, locale)
localizePath(routeKey, options)
localizePath(routeKey, locale, options)
```

## `resolveRouteKey()`

Resolve any known localized URL back to its canonical route key:

```ts
resolveRouteKey('/ru/o-nas')                    // '/about'
resolveRouteKey('/en/about')                    // '/about'
resolveRouteKey('https://site.com/ru/o-nas')   // '/about'
resolveRouteKey('/unknown')                     // null
```

### Options

```ts
type LocalizedPathOptions = {
  prefix?: boolean                                     // force-include or exclude the locale prefix
  absolute?: boolean                                   // force full URL or path-only output
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

### `absolute`

Control whether the result is a full URL or a plain path:

```ts
localizePath('/about', 'ru')
// → '/ru/o-nas'

localizePath('/about', 'ru', { absolute: true })
// → 'https://site.com/ru/o-nas'

localizePath('https://site.com/en/about', 'fr')
// → 'https://site.fr/a-propos'

localizePath('https://site.com/en/about', 'fr', { absolute: false })
// → '/a-propos'
```

- `absolute: undefined` keeps the input form: path in -> path out, full URL in -> full URL out
- `absolute: true` always returns a full URL using `i18n.baseUrl` or a matching domain `baseUrl`
- `absolute: false` always returns a path-only URL

If `absolute: true` is used without any configured `baseUrl`, the library warns and returns a path-only URL.

## Return shape

```ts
type UseI18nRouteResult = {
  locale
  localeConfig
  domainConfig
  routeConfig
  setRouteParamVariants(paramName, variants)
  setRouteQueryVariants(paramName, variants)
  resolveRouteKey(url)
  localizePath(routeKey, locale?, options?)
}
```

Next: [routeConfig](/guide/route-config)
