# I18n Routes

`routes` is the core of the package. It maps canonical route keys to locale-specific public URLs.

## Route mapper

```ts
routes: {
  '/': {
    en: '/',
    ru: '/',
  },
  '/about': {
    en: '/about',
    ru: '/o-nas',
    fr: '/a-propos',
  },
}
```

Read it as:

- canonical route `/about`
- English public URL `/about`
- Russian public URL `/o-nas`
- French public URL `/a-propos`

## Canonical vs localized URL

Incoming request:

```text
/ru/o-nas
```

Resolved values:

- `pageContext.locale` -> `ru`
- `routeConfig.canonicalUrl` -> `/about`
- `routeConfig.currentLocaleUrl` -> `/ru/o-nas`

## `localizePath()`

Use `localizePath()` to build links from canonical paths.

```ts
const { localizePath } = useI18nRoute(pageContext)

localizePath('/about')
localizePath('/about', 'ru')
localizePath('/about', { prefixDefaultLocale: true })
localizePath('/about', 'en', { noPrefixLocale: true })
```

Examples:

| Call | Result |
| --- | --- |
| `localizePath('/about', 'ru')` | `/ru/o-nas` |
| `localizePath('/about', 'en')` | `/en/about` or `/about` depending on config |
| `localizePath('/')` | localized home URL for current locale |

## Important rule

Pass canonical paths to `localizePath()` whenever possible.

Correct:

```ts
localizePath('/about')
```

Wrong:

```ts
localizePath('/ru/o-nas')
```

Next: [Domains](/guide/domains)
