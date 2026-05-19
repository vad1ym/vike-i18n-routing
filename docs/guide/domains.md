# Domains

Use `domains` when locale sets or default locale differ by host.

## Example

```ts
// +config
i18n: {
  baseUrl: 'https://site.com',
  defaultLocale: 'en',
  locales: ['en', 'ru', 'fr'],
  prefixDefaultLocale: true,
  domains: {
    'site.com': {
      baseUrl: 'https://site.com',
      defaultLocale: 'en',
      locales: ['en', 'ru'],
    },
    'site.fr': {
      baseUrl: 'https://site.fr',
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
- `localizePath(..., { absolute: true })` can use `https://site.fr`

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

## Per-domain `baseUrl`

Set `baseUrl` per domain when you want `localizePath()` to build absolute cross-domain links:

```ts
localizePath('/about', 'fr')
// → '/a-propos'

localizePath('/about', 'fr', { absolute: true })
// → 'https://site.fr/a-propos'

localizePath('https://site.com/en/about', 'fr')
// → 'https://site.fr/a-propos'
```

Without `absolute: true`, path input stays path-only even if the target locale belongs to another domain.

Next: [useI18nRoute](/guide/use-i18n-route)
