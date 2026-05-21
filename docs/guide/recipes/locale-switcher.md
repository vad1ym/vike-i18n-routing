# Locale Switcher

Build the target URL from the current logical route.

```ts
const { switchLocaleUrl } = useI18nRoute(pageContext)

function switchLocale(targetLocale: string) {
  return switchLocaleUrl(targetLocale)
}
```

`switchLocaleUrl()` is a convenience alias for:

```ts
localizePath(i18nRoute.logicalUrl, targetLocale, { prefix: true })
```

You can still pass extra options when needed:

```ts
switchLocaleUrl('ru', { absolute: true })
```
