# Domains

Use `domains` when locale sets or default locale differ by host.

## Example

```ts
// +config
i18n: {
  defaultLocale: 'en',
  locales: ['en', 'ru', 'fr'],
  prefixDefaultLocale: true,
  domains: {
    'site.com': {
      defaultLocale: 'en',
      locales: ['en', 'ru'],
    },
    'site.fr': {
      defaultLocale: 'fr',
      locales: ['fr', 'en'],
      prefixDefaultLocale: false,
      meta: {
        supportedAuthCountries: ['fr', 'uk', 'ru'],
      },
    },
  },
  routes: {
    '/': { en: '/', ru: '/', fr: '/' },
    '/about': { en: '/about', ru: '/o-nas', fr: '/a-propos' },
  },
}
```

## What changes per domain

For `site.com`:

- active locales are `en` and `ru`
- default locale is `en`

For `site.fr`:

- active locales are `fr` and `en`
- default locale is `fr`
- default locale can be unprefixed

## Domain detection

By default, the library resolves the domain from `pageContext.domain`, request headers, or request URL.

You can override it:

```ts
// +config
domainDetector(pageContext) {
  return pageContext.headers?.host as string
}
```

## Locale detection per domain

Each domain inherits the global `localeDetector`. To customize locale detection globally, see [Getting Current Locale](/guide/current-locale#localedetector).

## Per-domain locale metadata

Domain `locales` can override or extend the base locale entries. Locale objects are merged per locale code, and `meta` is merged shallowly.

```ts
locales: {
  en: { urlPrefix: 'en', meta: { currency: 'USD', region: 'global' } },
  de: { urlPrefix: 'de', meta: { currency: 'EUR', region: 'global' } },
},
domains: {
  'site.de': {
    defaultLocale: 'de',
    locales: {
      de: { urlPrefix: 'de', meta: { region: 'de' } },
      en: { urlPrefix: 'en', meta: { region: 'eu' } },
    },
  },
}
```

Resolved values on `site.de`:

- `localeConfig.locales.de.meta.currency` -> `EUR`
- `localeConfig.locales.de.meta.region` -> `de`
- `localeConfig.currentLocaleMeta` -> metadata of the active locale

## Per-domain routes

Override route translations for a specific domain. Domain routes are merged with global routes — the domain entry wins on key conflicts.

```ts
domains: {
  'ru.site.com': {
    defaultLocale: 'ru',
    locales: ['ru'],
    prefixDefaultLocale: false,
    routes: {
      '/about': { ru: '/o-sajte' },  // overrides global ru translation
    },
  },
}
```

## Per-domain redirects

Domains also accept `redirects`. Domain redirects are merged with global redirects — domain entries take priority on key conflicts.

```ts
domains: {
  'ru.site.com': {
    defaultLocale: 'ru',
    locales: ['ru'],
    redirects: {
      '/legacy': '/about',
    },
  },
}
```

See [Redirects](/guide/redirects) for full redirect pattern documentation.

Next: [useI18nRoute](/guide/use-i18n-route)
