# SEO Alternates

Use `routeConfig.alternateUrls` to render `<link rel="alternate">`.

```ts
const { routeConfig } = useI18nRoute(pageContext)

const alternates = routeConfig.alternateUrls
```

Example:

```ts
[
  { locale: 'en', url: '/en/about' },
  { locale: 'ru', url: '/ru/o-nas' },
]
```
