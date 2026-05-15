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

## Locale detection

You can inject your own locale detection:

```ts
// +config
localeDetector(pageContext) {
  if (pageContext.session?.locale) return pageContext.session.locale
  return null
}
```

Next: [Params Translation](/guide/params-translation)
