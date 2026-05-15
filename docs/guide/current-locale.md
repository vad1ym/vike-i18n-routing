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

React version:

```ts
import { usePageContext } from 'vike-react/usePageContext'
import { useI18nRoute } from 'vike-i18n-routing/react'

const pageContext = usePageContext()
const { locale } = useI18nRoute(pageContext)
```

In the React export, `locale` is a plain value.

## `localeDetector`

Use `localeDetector` when locale should be derived from your own app state before fallback detection runs, or when you need to disable specific built-in detection sources.

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

You can also pass an object to disable specific built-in sources:

```ts
// +config
i18n: {
  localeDetector: {
    acceptLanguageHeader: false,
    localeCookie: false,
    queryParams: false,
    session: true,
  },
}
```

Flags default to `true`. Setting a flag to `false` skips that source.

## Detection order

For requests without an explicit locale prefix, locale resolution checks:

1. `localeDetector(pageContext)` if `localeDetector` is a function
2. query `locale` unless `localeDetector.queryParams === false`
3. query `lang` unless `localeDetector.queryParams === false`
4. locale cookie unless `localeDetector.localeCookie === false`
5. `session.locale` unless `localeDetector.session === false`
6. `Accept-Language` unless `localeDetector.acceptLanguageHeader === false`
7. `defaultLocale`

Next: [Usage On Client](/guide/client-usage)
