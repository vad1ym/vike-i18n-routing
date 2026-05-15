# Base Config

Everything lives in `i18n` inside `pages/+config.ts`.

```ts
// +config
type I18nConfig = {
  defaultLocale: string
  locales: string[] | Record<string, { urlPrefix: string }>
  routes: Record<string, Record<string, string>>
  prefixDefaultLocale?: boolean
  domains?: Record<string, DomainConfig>
  domainDetector?: (pageContext) => string | null | undefined
  localeDetector?:
    | ((pageContext) => string | null | undefined)
    | {
        acceptLanguageHeader?: boolean
        localeCookie?: boolean
        queryParams?: boolean
        session?: boolean
      }
  localeCookie?: string | false
}
```

## `locales`

Simple form:

```ts
// +config
locales: ['en', 'ru', 'fr']
```

Expanded form:

```ts
// +config
locales: {
  en: { urlPrefix: 'en' },
  ru: { urlPrefix: 'ru' },
  fr: { urlPrefix: 'fr' },
}
```

Use object form when the URL prefix should be explicit.

## `routes`

`routes` maps canonical route keys to localized public paths.

```ts
// +config
routes: {
  '/': {
    en: '/',
    ru: '/',
  },
  '/about': {
    en: '/about',
    ru: '/o-nas',
  },
}
```

The key on the left is what your app works with internally.

## `prefixDefaultLocale`

When `true`:

```ts
// +config
prefixDefaultLocale: true
```

- `/about` redirects to `/en/about`
- `/en/about` stays prefixed

When `false`:

```ts
// +config
prefixDefaultLocale: false
```

- `/about` stays `/about`
- `/en/about` redirects to `/about`

## Minimal config

```ts
// +config
i18n: {
  defaultLocale: 'en',
  locales: ['en', 'ru'],
  routes: {
    '/': { en: '/', ru: '/' },
    '/about': { en: '/about', ru: '/o-nas' },
  },
}
```

## Optional base settings

```ts
// +config
i18n: {
  localeCookie: 'locale',
  localeDetector(pageContext) {
    return pageContext.session?.locale
  },
}
```

Built-in locale detection sources can also be toggled without replacing the detector:

```ts
// +config
i18n: {
  localeCookie: 'locale',
  localeDetector: {
    acceptLanguageHeader: false,
    localeCookie: false,
    queryParams: false,
    session: true,
  },
}
```

When `localeDetector` is a function, behavior stays the same as before.

Next: [Getting Current Locale](/guide/current-locale)
