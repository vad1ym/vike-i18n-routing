# SEO Alternates

Use `alternateUrls` from `useI18nRoute()` or `i18nRoute.alternateUrls` to render `<link rel="alternate">`.

```ts
const { alternateUrls } = useI18nRoute(pageContext)

const alternates = alternateUrls
```

Example:

```ts
[
  { locale: 'en', url: '/en/about' },
  { locale: 'ru', url: '/ru/o-nas' },
]
```
