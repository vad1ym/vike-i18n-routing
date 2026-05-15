# Getting Current Locale

The current locale is exposed on `pageContext.locale` after the plugin resolves the request.

## In Vike hooks

```ts
function onBeforeRender(pageContext: Vike.PageContext) {
  const locale = pageContext.locale
}
```

## Through `useI18nRoute()`

Root version:

```ts
import { useI18nRoute } from 'vike-i18n-routing'

const { locale } = useI18nRoute(pageContext)
```

Vue version:

```ts
import { usePageContext } from 'vike-vue/usePageContext'
import { useI18nRoute } from 'vike-i18n-routing/vue'

const pageContext = usePageContext()
const { locale } = useI18nRoute(pageContext)
```

In the Vue export, `locale` is a computed ref. In the root export, `locale` is a plain string getter.

## `localeDetector`

Use `localeDetector` when locale should be derived from your own app state before fallback detection runs.

```ts
// +config
i18n: {
  localeDetector(pageContext) {
    if (pageContext.session?.locale) return pageContext.session.locale
    return null
  },
}
```

Return a locale code to stop detection.

Return `null` or `undefined` to continue with the built-in flow.

## Detection order

For requests without an explicit locale prefix, locale resolution checks:

1. `localeDetector(pageContext)`
2. query `locale`
3. query `lang`
4. locale cookie
5. `session.locale`
6. `Accept-Language`
7. `defaultLocale`

Next: [Usage On Client](/guide/client-usage)
