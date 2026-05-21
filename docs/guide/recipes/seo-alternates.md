# SEO Alternates

`vike-i18n-routing` provides three helpers for building SEO `<link>` tags: `getCanonicalLink`, `getHreflangLinks`, and `getSeoLinks`.

## getSeoLinks

The easiest way — returns both canonical and hreflang links in one call:

```ts
import { getSeoLinks } from 'vike-i18n-routing'
import { useI18nRoute } from 'vike-i18n-routing'

const { alternateUrls, defaultLocaleUrl } = useI18nRoute(pageContext)

const { canonical, hreflang } = getSeoLinks(alternateUrls, 'en', defaultLocaleUrl)
```

`canonical` is `{ href: string }` — use it for `<link rel="canonical">`.

`hreflang` is an array of `{ hreflang: string, href: string }` — one entry per locale plus an `x-default` entry pointing to the default locale URL.

**Vue example:**

```vue
<template>
  <link rel="canonical" :href="canonical.href" />
  <link
    v-for="link in hreflang"
    :key="link.hreflang"
    rel="alternate"
    :hreflang="link.hreflang"
    :href="link.href"
  />
</template>

<script setup lang="ts">
import { usePageContext } from 'vike-vue/usePageContext'
import { useI18nRoute, getSeoLinks } from 'vike-i18n-routing'

const pageContext = usePageContext()
const { alternateUrls, defaultLocaleUrl } = useI18nRoute(pageContext)
const { canonical, hreflang } = getSeoLinks(alternateUrls, 'en', defaultLocaleUrl)
</script>
```

**React example:**

```tsx
import { usePageContext } from 'vike-react/usePageContext'
import { useI18nRoute, getSeoLinks } from 'vike-i18n-routing'

export function SeoLinks() {
  const pageContext = usePageContext()
  const { alternateUrls, defaultLocaleUrl } = useI18nRoute(pageContext)
  const { canonical, hreflang } = getSeoLinks(alternateUrls, 'en', defaultLocaleUrl)

  return (
    <>
      <link rel="canonical" href={canonical.href} />
      {hreflang.map((link) => (
        <link key={link.hreflang} rel="alternate" hreflang={link.hreflang} href={link.href} />
      ))}
    </>
  )
}
```

## Individual helpers

If you need more control, use the individual helpers:

```ts
import { getCanonicalLink, getHreflangLinks } from 'vike-i18n-routing'

// <link rel="canonical">
const canonical = getCanonicalLink(defaultLocaleUrl)
// → { href: '/en/about' }

// <link rel="alternate" hreflang>
const hreflang = getHreflangLinks(alternateUrls, 'en')
// → [
//     { hreflang: 'en', href: '/en/about' },
//     { hreflang: 'ru', href: '/ru/o-nas' },
//     { hreflang: 'x-default', href: '/en/about' },
//   ]
```

## alternateUrls shape

`alternateUrls` is available on every resolved route:

```ts
const { alternateUrls } = useI18nRoute(pageContext)
// [
//   { locale: 'en', url: '/en/about' },
//   { locale: 'ru', url: '/ru/o-nas' },
// ]
```

For aliased routes, `alternateUrls` uses the alias paths (not the target route paths), so hreflang tags correctly reflect the URLs users actually visit.
