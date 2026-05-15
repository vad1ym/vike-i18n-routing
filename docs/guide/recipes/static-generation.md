# Static Generation

::warning Dynamic Routes
`generateStaticPaths()` currently supports only static routes.

Dynamic routes are skipped with a warning for now.
::

::warning Domains
`generateStaticPaths()` ignores `domains`.

Static output for domain-based routing is not supported yet.
::

`generateStaticPaths()` currently supports only static routes.

Dynamic routes are skipped with a warning for now.

In Vike, use `onBeforePrerenderStart()` from a single static page file to provide the localized URL list.

```ts
import { generateStaticPaths } from 'vike-i18n-routing'

export { onBeforePrerenderStart }

async function onBeforePrerenderStart() {
  return await generateStaticPaths({
    defaultLocale: 'en',
    locales: ['en', 'ru'],
    routes: {
      '/': { en: '/', ru: '/' },
      '/about': { en: '/about', ru: '/o-nas' },
    },
  })
}
```

`generateStaticPaths()`:

- includes localized paths for every configured locale
- respects `prefixDefaultLocale`
- skips dynamic routes with a warning because they are not supported yet

If `domains` is configured, `generateStaticPaths()` logs a warning and ignores it for now. Static output for domain-based routing is not supported yet.
