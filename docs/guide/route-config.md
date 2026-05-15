# routeConfig

`routeConfig` describes the resolved request and all derived localized URLs.

## Fields

```ts
type RouteConfig = {
  requestUrl: string
  defaultLocaleUrl: string
  currentLocaleUrl: string
  redirectTo?: string
  canonicalUrl: string
  i18nUrl: string
  i18nUrlParams: Record<string, string>
  alternateUrls: { locale: string; url: string }[]
  paramVariants: Record<string, { variants: Record<string, string> }>
  queryVariants: Record<string, { variants: Record<string, string> }>
}
```

## Main values

- `requestUrl`: incoming request URL
- `canonicalUrl`: canonical internal route, including canonicalized query values
- `currentLocaleUrl`: normalized URL for the active locale
- `defaultLocaleUrl`: normalized URL for the default locale
- `redirectTo`: redirect target when the request URL should be normalized

## Alternates

`alternateUrls` is useful for SEO and switchers.

```ts
routeConfig.alternateUrls
```

Example:

```ts
[
  { locale: 'en', url: '/en/about' },
  { locale: 'ru', url: '/ru/o-nas' },
]
```

## Params

`i18nUrlParams` contains extracted route params after route matching.

`paramVariants` contains registered translated param values.

`queryVariants` contains registered translated query values.

Next: [localeConfig](/guide/locale-config)
