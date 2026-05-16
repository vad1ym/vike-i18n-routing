# Redirects

Use `redirects` to declare URL redirects in config. Sources support full `path-to-regexp` pattern syntax — the same as `routes`.

## Basic redirect

```ts
// +config
i18n: {
  redirects: {
    '/old-about': '/about',
  },
}
```

## Locale-aware redirects

When the redirect source matches a canonical route key (or a path that matches one), the redirect automatically applies to all locale variants of that route.

```ts
routes: {
  '/specialities/:speciality': {
    en: '/specialities/:speciality',
    ru: '/specialnosti/:speciality',
  },
},
redirects: {
  '/specialities/diver': '/specialities/driver',
},
```

This single entry covers both:

- `/en/specialities/diver` → `/en/specialities/driver`
- `/ru/specialnosti/diver` → `/ru/specialnosti/driver`

The redirect target is also localized automatically — if the target is a known route key, its locale-specific path is used.

## Param transfer

Named params captured from the source pattern are filled into the target:

```ts
redirects: {
  '/medicines/:country': '/drugs/:country',
},
```

- `/en/medicines/ua` → `/en/drugs/ua`
- `/ru/medicines/ua` → `/ru/preparaty/ua` (target `/drugs/:country` localized to RU)

## Wildcard tail stripping

Use `{*name}` (path-to-regexp v8 named wildcard) to capture and discard a URL tail:

```ts
redirects: {
  '/medicines/:country/{*rest}': '/drugs/:country',
},
```

- `/en/medicines/ua/extra/path` → `/en/drugs/ua`

Named wildcard params not referenced in the target are silently dropped.

## Locale-scoped redirects

Restrict a redirect to specific locales with the `locales` option:

```ts
redirects: {
  '/old-page': { url: '/about', locales: ['en'] },
},
```

This fires only for English. Other locales are unaffected.

## Per-domain redirects

Each domain config accepts its own `redirects`. Domain-level redirects are merged with global ones; domain entries take priority on key conflicts.

```ts
domains: {
  'ru.site.com': {
    defaultLocale: 'ru',
    locales: ['ru'],
    redirects: {
      '/legacy-ru': '/about',
    },
  },
}
```

See [Domains](/guide/domains) for a full domain config example.
