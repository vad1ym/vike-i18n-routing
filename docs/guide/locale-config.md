# localeConfig

`localeConfig` is the normalized locale state used for the current request.

## Shape

```ts
type PageContextLocaleConfig = {
  defaultLocale: string
  locales: Record<string, { urlPrefix: string }>
  currentLocale: string
  prefixDefaultLocale: boolean
}
```

## Fields

- `defaultLocale`: fallback locale for the current domain
- `locales`: active locale map with `urlPrefix`
- `currentLocale`: resolved locale for the current request
- `prefixDefaultLocale`: whether the default locale should appear in the URL

## Example

```ts
const { localeConfig } = useI18nRoute(pageContext)

localeConfig.currentLocale
localeConfig.defaultLocale
Object.keys(localeConfig.locales)
localeConfig.prefixDefaultLocale
```

In Vue:

```ts
const locales = Object.keys(localeConfig.value.locales)
```

Next: [domainConfig](/guide/domain-config)
