# localeConfig

`localeConfig` is the normalized locale state used for the current request.

## Shape

```ts
type PageContextLocaleConfig = {
  defaultLocale: string
  locales: Record<string, { urlPrefix: string; meta?: Record<string, any> }>
  currentLocale: string
  currentLocaleMeta?: Record<string, any>
  prefixDefaultLocale: boolean
}
```

## Fields

- `defaultLocale`: fallback locale for the current domain
- `locales`: active locale map with `urlPrefix` and optional `meta`
- `currentLocale`: resolved locale for the current request
- `currentLocaleMeta`: metadata of the resolved locale, if configured
- `prefixDefaultLocale`: whether the default locale should appear in the URL

## Example

```ts
const { localeConfig } = useI18nRoute(pageContext)

localeConfig.currentLocale
localeConfig.currentLocaleMeta?.currency
localeConfig.defaultLocale
Object.keys(localeConfig.locales)
localeConfig.locales.en.meta?.region
localeConfig.prefixDefaultLocale
```

In Vue:

```ts
const locales = Object.keys(localeConfig.value.locales)
```

Next: [domainConfig](/guide/domain-config)
