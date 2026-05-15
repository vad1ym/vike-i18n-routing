# Quick Start

## Install

```bash
pnpm add vike-i18n-routing
```

```bash
npm install vike-i18n-routing
```

```bash
yarn add vike-i18n-routing
```

`vike` is a peer dependency and should already be installed in the app.

## Connect the plugin

Add the config export and define `i18n` in your Vike app config.

```ts
// +config
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

## Keep file routes canonical

Your app still uses normal Vike page files:

```text
pages/
  index/+Page.vue
  about/+Page.vue
```

There is no separate page file for `/o-nas`. The public path is localized, the app route is not.

## What this setup gives you

| Request URL | Result |
| --- | --- |
| `/en/about` | canonical route is `/about` |
| `/ru/o-nas` | canonical route is `/about` |
| `/about` | redirects to `/en/about` |
| `/ru/about` | redirects to `/ru/o-nas` |

Next: [Base Config](/guide/base-config)
