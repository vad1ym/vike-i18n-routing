# Route Aliases

Use `aliases` to map additional URLs to existing routes without duplicating route definitions. Unlike redirects, aliases serve the target page **at the alias URL** — the browser URL stays unchanged.

Useful for migrations, vanity URLs, and parametric URL namespaces.

## Simple alias

A plain string maps one URL to an existing route key:

```ts
// +config
i18n: {
  routes: {
    '/about': { en: '/about', ru: '/o-nas' },
  },
  aliases: {
    '/company': '/about',
  },
}
```

| Incoming URL | Renders | URL stays |
| --- | --- | --- |
| `/en/company` | `/about` page | `/en/company` |
| `/ru/company` | `/about` page (RU) | `/ru/company` |

All locale logic and `alternateUrls` are inherited from the target route.

## Localized alias

When the alias itself needs locale-specific paths, use an object with a `target` field plus locale keys:

```ts
aliases: {
  '/spain/about': {
    target: '/about',          // route key to render
    en: '/spain/about',
    ru: '/spain/o-nas',
  },
},
```

| Incoming URL | Renders | `alternateUrls` |
| --- | --- | --- |
| `/en/spain/about` | `/about` page (EN) | uses alias paths |
| `/ru/spain/o-nas` | `/about` page (RU) | uses alias paths |

`alternateUrls` for a localized alias uses the alias paths, not the original route's paths — to avoid hreflang conflicts.

## Parametric alias

For aliasing a subtree with an extra URL parameter, use `path-to-regexp` syntax:

```ts
routes: {
  '/blog/:slug': { en: '/blog/:slug', ru: '/blog/:slug' },
},
aliases: {
  '/blog/:country/:slug': '/blog/:slug',
},
```

| Incoming URL | Renders | `routeParams` |
| --- | --- | --- |
| `/en/blog/spain/my-post` | `/blog/:slug` page | `{ country: 'spain', slug: 'my-post' }` |

The extra `:country` param is forwarded into `pageContext.routeParams` alongside the route's own params.

## Per-domain aliases

Aliases can be scoped to a specific domain:

```ts
domains: {
  'site.es': {
    defaultLocale: 'es',
    locales: ['es'],
    aliases: {
      '/empresa': '/about',
    },
  },
}
```

Domain-level aliases override the global `aliases` for that domain. Global aliases apply on all domains unless a domain defines its own `aliases`.

## Alias vs redirect

| | Alias | Redirect |
| --- | --- | --- |
| Browser URL | Unchanged | Changes to target |
| HTTP status | None (rewrite) | 301 / 302 |
| Use case | Vanity URLs, extra entry points | URL migrations |

Next: [Redirects](/guide/redirects)
