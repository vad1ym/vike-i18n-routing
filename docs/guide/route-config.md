# i18nRoute state

`i18nRoute` describes the resolved request and all derived localized URLs.

## Fields

```ts
type I18nRoute = {
  locale: string
  locales: string[]
  params: Record<string, string>
  logicalUrl: string
  routeKey?: string
  requestUrl: string
  defaultLocaleUrl: string
  currentLocaleUrl: string
  alternateUrls: { locale: string; url: string }[]
  redirectTo?: string
  redirectStatus?: 301 | 302
  renderTo?: string
  aliasFrom?: string
  paramVariants: Record<string, { variants: Record<string, string> }>
  queryVariants: Record<string, { variants: Record<string, string> }>
  localeConfig: PageContextLocaleConfig
  domainConfig: PageContextDomainConfig
}
```

## Main values

- `requestUrl`: incoming request URL
- `logicalUrl`: canonical internal route, including canonicalized query values
- `routeKey`: canonical route pattern key used by `localizePath()`
- `currentLocaleUrl`: normalized URL for the active locale
- `defaultLocaleUrl`: normalized URL for the default locale
- `redirectTo`: redirect target when the request URL should be normalized
- `params`: extracted route params after route matching

## Alternates

`alternateUrls` is useful for SEO and switchers.

```ts
i18nRoute.alternateUrls
```

Example:

```ts
[
  { locale: 'en', url: '/en/about' },
  { locale: 'ru', url: '/ru/o-nas' },
]
```

## Params

`paramVariants` contains registered translated param values.

`queryVariants` contains registered translated query values.

Next: [localeConfig](/guide/locale-config)
