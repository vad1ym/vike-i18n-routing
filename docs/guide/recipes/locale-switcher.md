# Locale Switcher

Build the target URL from the current logical route.

```ts
const { logicalUrl, localizePath } = useI18nRoute(pageContext)

function switchLocale(targetLocale: string) {
  return localizePath(logicalUrl, targetLocale)
}
```

Vue example:

```ts
function switchLocale(targetLocale: string) {
  return localizePath(logicalUrl, targetLocale, {
    prefix: true,
  })
}
```
