# domainConfig

`domainConfig` exposes the resolved domain-level override for the current request.

## Shape

```ts
type PageContextDomainConfig = {
  domain?: string
  defaultLocale?: string
  locales?: Record<string, { urlPrefix: string }>
  prefixDefaultLocale?: boolean
  meta?: Record<string, any>
}
```

## Usage

```ts
const { domainConfig } = useI18nRoute(pageContext)

domainConfig.domain
domainConfig.defaultLocale
domainConfig.prefixDefaultLocale
domainConfig.meta
```

If no domain override is matched, the object can be as small as:

```ts
{ domain: undefined }
```

## `meta`

`meta` is passed through unchanged and can be used for app-specific behavior.

```ts
domains: {
  'site.fr': {
    meta: {
      supportedAuthCountries: ['fr', 'uk', 'ru'],
    },
  },
}
```

Then:

```ts
domainConfig.meta?.supportedAuthCountries
```
