# domainConfig

`domainConfig` exposes the resolved domain-level override for the current request.

If you only need the current domain string, use the `domain` shortcut from `useI18nRoute()`.

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

Shortcut:

```ts
const { domain } = useI18nRoute(pageContext)
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
