# Getting Current Locale

The current locale is exposed on `pageContext.locale` after the plugin resolves the request.

## In Vike hooks

```ts
function onBeforeRender(pageContext: Vike.PageContext) {
  const locale = pageContext.locale
}
```

## Through `useI18nRoute()`

In components, pass `pageContext` directly:

```ts
import { usePageContext } from 'vike-vue/usePageContext'
import { useI18nRoute } from 'vike-i18n-routing'

const { i18nRoute } = useI18nRoute(usePageContext())
const locale = i18nRoute.localeConfig.currentLocale
const localeCurrency = i18nRoute.localeConfig.currentLocaleMeta?.currency
```

See [useI18nRoute](/guide/use-i18n-route) for the full API.

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

## `debug`

Locale negotiation logging is enabled by default on the dev server. Set `debug: true` to force it on, or `debug: false` to force it off.

```ts
// +config
i18n: {
  debug: true,
}
```

Example output:

```text
[vike-i18n-routing] locale resolved: ru
[vike-i18n-routing]   ✗ localeDetector fn -> null
[vike-i18n-routing]   ✗ query ?locale -> not present
[vike-i18n-routing]   ✓ cookie 'i18n-locale' -> 'ru'
```

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
