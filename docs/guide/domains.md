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

## Locale detection

You can inject your own locale detection:

```ts
// +config
localeDetector(pageContext) {
  if (pageContext.session?.locale) return pageContext.session.locale
  return null
}
```

Next: [Redirects](/guide/redirects)
