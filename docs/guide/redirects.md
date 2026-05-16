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

When the redirect source matches a known route pattern, the redirect applies to all locale variants automatically.

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

| Incoming URL | Redirects to |
| --- | --- |
| `/en/specialities/diver` | `/en/specialities/driver` |
| `/ru/specialnosti/diver` | `/ru/specialnosti/driver` |

The source is matched against the canonical route pattern. The target is localized using the same route config — so `/specialities/driver` becomes `/ru/specialnosti/driver` for Russian.

If the target does not match any route key, it is used as-is without localization.

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

Next: [Domains](/guide/domains)
