# Advanced TypeScript

The default runtime API keeps `localizePath()` permissive and accepts `string`.

If you want autocomplete and compile-time route-key validation, create a typed wrapper once per app.

## Typed wrapper

```ts
import { createUseI18nRoute } from 'vike-i18n-routing'
import type { I18nConfig } from 'vike-i18n-routing'

const i18n = {
  defaultLocale: 'en',
  locales: ['en', 'ru'],
  routes: {
    '/about': { en: '/about', ru: '/o-nas' },
    '/services/:item': { en: '/services/:item', ru: '/uslugi/:item' },
  },
} as const satisfies I18nConfig

export const useAppI18nRoute = createUseI18nRoute(i18n)
```

Then use the wrapper instead of the default hook:

```ts
const { localizePath, route } = useAppI18nRoute(pageContext)

localizePath('/about')
route('/services/:item')
// localizePath('/servises/:item') // TS error
```

## Grouped routes

Typed route keys also work with grouped route definitions.

```ts
const i18n = {
  defaultLocale: 'en',
  locales: ['en', 'ru'],
  routes: {
    '/blog': {
      '/:slug': { en: '/:slug', ru: '/:slug' },
      '/category/:category': {
        en: '/category/:category',
        ru: '/kategoriya/:category',
      },
    },
  },
} as const satisfies I18nConfig

const useAppI18nRoute = createUseI18nRoute(i18n)
const { localizePath } = useAppI18nRoute(pageContext)

localizePath('/blog/:slug')
localizePath('/blog/category/:category')
// localizePath('/blog') // TS error
```

## Why this is opt-in

Automatic route-key inference from `useI18nRoute(pageContext)` is constrained by current Vike type boundaries. The typed wrapper keeps the default API simple while still providing a strict TypeScript mode for projects that want it.
