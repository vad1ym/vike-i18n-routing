# Locale Switcher

Build the target URL from the current canonical route.

```ts
const { routeConfig, localizePath } = useI18nRoute(pageContext)

function switchLocale(targetLocale: string) {
  return localizePath(routeConfig.canonicalUrl, targetLocale)
}
```

Vue example:

```ts
function switchLocale(targetLocale: string) {
  return localizePath(routeConfig.value.canonicalUrl, targetLocale, {
    prefixDefaultLocale: true,
  })
}
```
