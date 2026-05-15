# Default Locale Without Prefix

Use `prefixDefaultLocale: false` when the default locale should not have `/en`-style prefix.

```ts
// +config
i18n: {
  defaultLocale: 'en',
  locales: ['en', 'ru'],
  prefixDefaultLocale: false,
  routes: {
    '/': { en: '/', ru: '/' },
    '/about': { en: '/about', ru: '/o-nas' },
  },
}
```
