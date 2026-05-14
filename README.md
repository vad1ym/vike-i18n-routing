<div align="center">

# vike-i18n-routing

<p>
  <strong>I18n routing for Vike with localized URLs, locale prefixes, domain-aware config, and URL helpers.</strong>
</p>

<p>
  <a href="https://www.npmjs.com/package/vike-i18n-routing"><img alt="npm version" src="https://img.shields.io/npm/v/vike-i18n-routing"></a>
  <a href="https://www.npmjs.com/package/vike-i18n-routing"><img alt="npm downloads" src="https://img.shields.io/npm/dm/vike-i18n-routing"></a>
  <a href="./LICENSE"><img alt="license" src="https://img.shields.io/badge/license-MIT-blue"></a>
  <a href="https://github.com/vad1ym/vike-i18n-routing/actions"><img alt="build status" src="https://img.shields.io/github/actions/workflow/status/vad1ym/vike-i18n-routing/publish.yml"></a>
</p>

</div>

I18n routing for [Vike](https://vike.dev/) with locale prefixes, translated route paths, locale detection, domain-aware locale configuration, and URL helpers.

This package lets you keep one canonical route structure inside your app while exposing localized URLs such as:

- `/en/about`
- `/ru/o-nas`
- `/fr/a-propos`

It resolves incoming localized URLs back to one canonical route, redirects invalid locale/path combinations to the correct URL, and exposes helpers to build localized URLs anywhere in your app.

## Status

> [!WARNING]
> This package is currently under development and should be treated as a proof of concept.
> The API, behavior, and configuration shape may still change while the project is being validated.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [How It Works](#how-it-works)
- [Configuration](#configuration)
- [Dynamic Routes](#dynamic-routes)
- [Slug Variants](#slug-variants)
- [Domain-Based Locale Config](#domain-based-locale-config)
- [Locale Detection](#locale-detection)
- [Cookie Behavior](#cookie-behavior)
- [Runtime Helpers](#runtime-helpers)
- [Page Context](#page-context)
- [Example](#example)
- [Development](#development)
- [Current Scope](#current-scope)
- [License](#license)

## Features

- Locale-prefixed routing for Vike
- Translated static routes like `/about` -> `/o-nas`
- Dynamic route patterns via `path-to-regexp`
- Optional segments, for example `/services/:category{/:tab}`
- Locale detection from URL params, cookies, session, and `Accept-Language`
- Automatic locale cookie persistence
- Per-domain locale config
- URL helpers for alternates and localized links
- Slug variant support for dynamic params

## Installation

Choose your package manager:

```bash
pnpm add vike-i18n-routing
```

```bash
npm install vike-i18n-routing
```

```bash
yarn add vike-i18n-routing
```

Peer dependency:

- `vike >= 0.4.259`

## Quick Start

Extend your Vike config with the plugin config and provide an `i18n` definition.

```ts
// Result:
// /en/about
// /ru/o-nas
// /fr/a-propos
```

```ts
// pages/+config.ts
import vikeVue from 'vike-vue/config'
import vikeI18n from 'vike-i18n-routing/config'
import type { Config } from 'vike/types'

export default {
  extends: [vikeVue, vikeI18n],

  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ru'],
    prefixDefaultLocale: true,
    routes: {
      '/': { en: '/', ru: '/' },
      '/about': { en: '/about', ru: '/o-nas' },
    },
  },
} satisfies Config
```

With that config:

- `/en/about` resolves to canonical route `/about`
- `/ru/o-nas` resolves to canonical route `/about`
- `/about` redirects to `/en/about`
- `/ru/about` redirects to `/ru/o-nas`

Your page files still use the canonical route structure:

```text
pages/
  index/+Page.vue
  about/+Page.vue
```

## How It Works

The plugin runs in `onBeforeRoute` and:

1. Detects the active locale
2. Resolves the incoming localized path to a canonical route path
3. Redirects to the correct localized URL when needed
4. Exposes `pageContext.locale` and `pageContext.i18nRoute`

It also writes the resolved locale to a cookie during render unless cookie support is disabled.

> [!TIP]
> Your actual page files stay canonical. Only the public URLs are localized.

## Configuration

### `I18nConfig`

```ts
type I18nConfig = {
  defaultLocale: string
  locales: string[] | Record<string, { urlPrefix: string }>
  routes: Record<string, Record<string, string>>
  prefixDefaultLocale?: boolean
  domains?: Record<string, DomainConfig>
  domainDetector?: (pageContext: I18nPageContext) => string | null | undefined
  localeDetector?: (pageContext: I18nPageContext) => string | null | undefined
  localeCookie?: string | false
}
```

### Locales

Simple array form:

```ts
locales: ['en', 'ru', 'fr']
```

Object form when you want explicit URL prefixes:

```ts
locales: {
  en: { urlPrefix: 'en' },
  ru: { urlPrefix: 'ru' },
  fr: { urlPrefix: 'fr' },
}
```

### Routes

Route keys are canonical app routes. Values are locale-specific public URLs.

This means your code can keep using one stable route key while users see translated URLs.

```ts
routes: {
  '/': {
    en: '/',
    ru: '/',
    fr: '/',
  },
  '/about': {
    en: '/about',
    ru: '/o-nas',
    fr: '/a-propos',
  },
}
```

### `prefixDefaultLocale`

When `true`:

- `/about` redirects to `/en/about`

When `false`:

- `/about` stays `/about`
- `/en/about` redirects back to `/about`

## Dynamic Routes

Dynamic patterns are supported through `path-to-regexp`.

```ts
routes: {
  '/services/:category{/:tab}': {
    en: '/services/:category{/:tab}',
    ru: '/uslugi/:category{/:tab}',
    fr: '/services-fr/:category{/:tab}',
  },
}
```

Examples:

- `/ru/uslugi/design` -> canonical `/services/design`
- `/ru/uslugi/design/specs` -> canonical `/services/design/specs`

> [!NOTE]
> Dynamic route matching and generation are powered by `path-to-regexp`.

## Slug Variants

Use `pageContext.i18nRoute.setRouteParamVariants()` when a dynamic param should have locale-specific slug values.

```ts
pageContext.i18nRoute.setRouteParamVariants('category', {
  en: 'web-development',
  ru: 'veb-razrabotka',
  fr: 'developpement-web',
})
```

Then:

- canonical `/services/web-development`
- RU localized `/ru/uslugi/veb-razrabotka`
- FR localized `/services-fr/developpement-web`

## Domain-Based Locale Config

You can override locales and default locale per domain.

```ts
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

The resolved domain metadata is exposed on `pageContext.i18nRoute.domainConfig`.

## Locale Detection

For unprefixed requests, locale resolution checks candidates in this order:

1. Custom `localeDetector(pageContext)`
2. `?locale=...`
3. `?lang=...`
4. Locale cookie
5. `session.locale`
6. `Accept-Language`
7. `defaultLocale`

This keeps unprefixed requests usable while still normalizing users onto the correct localized URL shape.

You can also override domain detection:

```ts
domainDetector(pageContext) {
  return pageContext.headers?.host as string
}
```

## Cookie Behavior

By default, the plugin stores the active locale in a cookie named `i18n-locale`.

Set a custom name:

```ts
localeCookie: 'locale'
```

Disable cookie writes entirely:

```ts
localeCookie: false
```

The default cookie name is `i18n-locale`.

## Page Context

The plugin adds:

- `pageContext.locale`
- `pageContext.i18nRoute.localeConfig`
- `pageContext.i18nRoute.domainConfig`
- `pageContext.i18nRoute.routeConfig`

The root `vike-i18n-routing` entry intentionally exposes only types related to
`pageContext.i18nRoute`. Runtime helpers stay internal to keep the public API small.

Example:

```ts
const locale = pageContext.locale
const canonicalRoute = pageContext.i18nRoute.routeConfig.vikeUrl
const publicUrl = pageContext.i18nRoute.routeConfig.currentLocaleUrl
const defaultLocaleUrl = pageContext.i18nRoute.routeConfig.defaultLocaleUrl
const alternateUrls = pageContext.i18nRoute.routeConfig.alternateUrls
```

## Example

A basic example app is available in [`examples/basic`](./examples/basic).

Run it with:

```bash
pnpm example
```

## Development

```bash
pnpm test
pnpm typecheck
```

## Current Scope

This package currently focuses on:

- Vike route resolution
- Localized path generation
- Redirect normalization
- Per-domain locale rules
- Cookie-backed locale persistence

It does not yet include built-in HTML SEO tag generation or full documentation site tooling.

## Why This Package

If you want Vike routes to:

- stay canonical in your app code
- render translated public URLs per locale
- redirect users to the correct locale/path combination
- support domain-specific locale rules

this package is the layer that handles that routing logic.

## License

MIT
