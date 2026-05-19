# vike-i18n-routing

<div align="center">

**Add multiple languages to your Vike app without duplicating pages**

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./.github/assets/banner-dark.png">
  <source media="(prefers-color-scheme: light)" srcset="./.github/assets/banner.png">
  <img src="./.github/assets/banner.png" alt="vike-i18n-routing banner" width="100%" />
</picture>

[![NPM Version](https://img.shields.io/npm/v/vike-i18n-routing?style=flat&colorA=18181B&colorB=C96B36)](https://www.npmjs.com/package/vike-i18n-routing)
[![NPM Downloads](https://img.shields.io/npm/dm/vike-i18n-routing?style=flat&colorA=18181B&colorB=C96B36)](https://www.npmjs.com/package/vike-i18n-routing)
[![License](https://img.shields.io/npm/l/vike-i18n-routing?style=flat&colorA=18181B&colorB=C96B36)](./LICENSE)

[**Documentation**](https://vad1ym.github.io/vike-i18n-routing/) • [**Quick Start**](https://vad1ym.github.io/vike-i18n-routing/guide/quick-start) • [**API**](https://vad1ym.github.io/vike-i18n-routing/guide/use-i18n-route)

</div>

---

## The problem

Vike's official i18n guide shows the manual approach — write `onBeforeRoute` yourself to extract the locale from the URL:

```ts
// pages/+onBeforeRoute.js
function onBeforeRoute(pageContext) {
  const { urlWithoutLocale, locale } = extractLocale(pageContext.urlParsed)
  return {
    pageContext: {
      locale,
      urlLogical: urlWithoutLocale,
    }
  }
}
```

This works for simple cases, but leaves everything else to you: locale detection from cookies and headers, redirecting wrong-locale URLs, building localized links, translated URL slugs, SEO alternates, multi-domain configs, and the boilerplate that grows with every new locale and route.

## The solution

`vike-i18n-routing` replaces that manual `onBeforeRoute` with a fully-featured plugin. You declare your routes and locales in config — the plugin handles everything else.

```ts
// pages/+config.ts
i18n: {
  defaultLocale: 'en',
  locales: {
    en: { urlPrefix: 'en', meta: { currency: 'USD', region: 'us' } },
    ru: { urlPrefix: 'ru', meta: { currency: 'UAH', region: 'ua' } },
  },
  routes: {
    '/about': { en: '/about', ru: '/o-nas' },
  },
}
```

```ts
const { localeConfig } = useI18nRoute(pageContext)

localeConfig.currentLocaleMeta?.currency
localeConfig.locales.en.meta?.region
```

The plugin:

- Resolves `/ru/o-nas` → page `about`, locale `ru`
- Resolves `/en/about` → page `about`, locale `en`
- Redirects `/about` → `/en/about` (missing prefix)
- Redirects `/ru/about` → `/ru/o-nas` (wrong-locale URL)
- Detects locale from URL, query param, cookie, session, `Accept-Language`
- Can log locale negotiation decisions in `debug` mode
- Provides `localizePath()` for building locale-aware links
- Generates `alternateUrls` for SEO hreflang tags

Large route maps can stay inside `routes` and be grouped by canonical prefix:

```ts
routes: {
  '/': { en: '/', ru: '/' },
  '/blog': {
    '/:slug': {},
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

Grouped route values are relative to the group prefix, so `/shop` + `/cart` becomes `/shop/cart`.

Your page files stay at canonical paths — one file per page, no duplication:

```
pages/
  about/+Page.vue     ← serves /en/about AND /ru/o-nas
```

## Setup

Install:

```bash
pnpm add vike-i18n-routing
```

Add to your Vike config:

```ts
// pages/+config.ts
import vikeVue from 'vike-vue/config'
import vikeI18n from 'vike-i18n-routing/config'
import type { Config } from 'vike/types'
import type { I18nConfig } from 'vike-i18n-routing'

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
  } satisfies I18nConfig,
} satisfies Config
```

## Using locale in components

In components, get `pageContext` from your framework's hook and pass it to `useI18nRoute`:

**Vue:**

```ts
import { usePageContext } from 'vike-vue/usePageContext'
import { useI18nRoute } from 'vike-i18n-routing'

const { i18nRoute, localizePath } = useI18nRoute(usePageContext())
```

```html
<!-- Always pass the canonical route key, not the localized URL -->
<a :href="localizePath('/about')">About</a>
<a :href="localizePath('/about', 'ru')">О нас</a>
```

**React:**

```tsx
import { usePageContext } from 'vike-react/usePageContext'
import { useI18nRoute } from 'vike-i18n-routing'

const { i18nRoute, localizePath } = useI18nRoute(usePageContext())
```

**Solid:**

```tsx
import { usePageContext } from 'vike-solid/usePageContext'
import { useI18nRoute } from 'vike-i18n-routing'

const { i18nRoute, localizePath } = useI18nRoute(usePageContext())
```

> This package handles routing only. For translating text content use `vue-i18n`, `react-intl`, or any other i18n library alongside it.

## More features

**Translated URL slugs** — not just the path shape, but the param values too:

```ts
// config
routes: {
  '/services/:category': {
    en: '/services/:category',
    ru: '/uslugi/:category',
  },
}

// in data loader — register per-item slug variants
setRouteParamVariants('category', { en: 'web-development', ru: 'veb-razrabotka' })
// /ru/uslugi/web-development now auto-redirects to /ru/uslugi/veb-razrabotka
```

**Config-level redirects** — locale-aware, supports `path-to-regexp` patterns:

```ts
redirects: {
  '/old-about': '/about',                    // applies to all locales
  '/medicines/:country': '/drugs/:country',  // transfers named params
  '/old-page': { url: '/about', locales: ['en'] },  // locale-scoped
}
```

**Multi-domain** — different locale sets and default locales per domain:

```ts
domains: {
  'site.com': { defaultLocale: 'en', locales: ['en', 'ru'] },
  'site.fr':  { defaultLocale: 'fr', locales: ['fr', 'en'], prefixDefaultLocale: false },
}
```

**Locale detection** — automatically from URL prefix, query param (`?locale=ru`), cookie, session, or `Accept-Language` header.

**SEO** — `routeConfig.alternateUrls` gives you all locale URLs for `<link rel="alternate" hreflang>` tags.

## Documentation

Full docs with API reference, all config options, and recipes:

**[vad1ym.github.io/vike-i18n-routing](https://vad1ym.github.io/vike-i18n-routing/)**

- [Quick Start](https://vad1ym.github.io/vike-i18n-routing/guide/quick-start)
- [I18n Routes](https://vad1ym.github.io/vike-i18n-routing/guide/i18n-routes)
- [Params Translation](https://vad1ym.github.io/vike-i18n-routing/guide/params-translation)
- [Redirects](https://vad1ym.github.io/vike-i18n-routing/guide/redirects)
- [Domains](https://vad1ym.github.io/vike-i18n-routing/guide/domains)
- [useI18nRoute API](https://vad1ym.github.io/vike-i18n-routing/guide/use-i18n-route)
- [Recipes](https://vad1ym.github.io/vike-i18n-routing/guide/recipes/)

## License

MIT
