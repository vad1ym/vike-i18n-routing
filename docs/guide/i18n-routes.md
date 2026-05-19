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

The `'/'` entry is required for the home route to be recognized. Without it, the root path won't participate in locale-prefix redirects and alternate URL generation.

## Group routes by prefix

Large apps can keep the same `routes` API and organize entries by canonical prefix:

```ts
routes: {
  '/blog': {
    '/:slug': {
      en: '/:slug',
      ru: '/:slug',
    },
    '/category/:category': {
      en: '/category/:category',
      ru: '/kategoriya/:category',
    },
  },
  '/shop': {
    '/cart': {
      en: '/cart',
      ru: '/korzina',
    },
  },
}
```

This is equivalent to:

```ts
routes: {
  '/blog/:slug': {
    en: '/blog/:slug',
    ru: '/blog/:slug',
  },
  '/blog/category/:category': {
    en: '/blog/category/:category',
    ru: '/blog/kategoriya/:category',
  },
  '/shop/cart': {
    en: '/shop/cart',
    ru: '/shop/korzina',
  },
}
```

Grouped route values are relative to the group prefix. If you need completely custom per-locale parent segments, use the flat form.

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
localizePath('/about', { prefix: false })
localizePath('/about', 'en', { prefix: false })
```

Examples:

| Call | Result |
| --- | --- |
| `localizePath('/about', 'ru')` | `/ru/o-nas` |
| `localizePath('/about', 'en')` | `/en/about` or `/about` depending on config |
| `localizePath('/about', 'en', { prefix: false })` | `/about` |
| `localizePath('/')` | localized home URL for current locale |

## Important rule

Always pass canonical paths to `localizePath()`.

Correct:

```ts
localizePath('/about')
```

Wrong:

```ts
localizePath('/ru/o-nas')
```

Passing a localized path works as a best-effort fallback, but the router may not be able to resolve it back to the canonical form — especially across locales. Always use the route config key.

## Domain-level route overrides

Individual domains can override route translations. See [Domains](/guide/domains#per-domain-routes).

Next: [Params Translation](/guide/params-translation)
