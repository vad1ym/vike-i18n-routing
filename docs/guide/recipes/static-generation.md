# Static Generation

::warning Domains
`generateStaticPaths()` ignores `domains`.

Static output for domain-based routing is not supported yet.
::

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
- supports dynamic routes when you provide `routeParams`
- skips dynamic routes without `routeParams` and logs a warning

## Dynamic routes

Pass a second argument with param sets keyed by canonical route key:

```ts
async function onBeforePrerenderStart() {
  return await generateStaticPaths({
    defaultLocale: 'en',
    locales: ['en', 'ru'],
    routes: {
      '/': { en: '/', ru: '/' },
      '/blog/:slug': {
        en: '/blog/:slug',
        ru: '/blog/:slug',
      },
    },
  }, {
    routeParams: {
      '/blog/:slug': [
        { slug: 'hello-world' },
        { slug: 'pricing' },
      ],
    },
  })
}
```

This generates:

- `/en/blog/hello-world`
- `/ru/blog/hello-world`
- `/en/blog/pricing`
- `/ru/blog/pricing`

If a dynamic route has no matching `routeParams`, `generateStaticPaths()` skips it and logs a warning.

If `domains` is configured, `generateStaticPaths()` logs a warning and ignores it for now. Static output for domain-based routing is not supported yet.

See also: [`examples/static-dynamic`](https://github.com/vad1ym/vike-i18n-routing/tree/dev/examples/static-dynamic) for a small prerendered product catalog based on a tiny DummyJSON-style sample.
