# Link Component

Ready-made `<Link>` components for Vue, React, and Solid that render an `<a>` tag with a localized `href`.

## Installation

The components are exported per framework from the package:

```ts
// Vue
import Link from 'vike-i18n-routing/vue/Link'

// React
import { Link } from 'vike-i18n-routing/react/Link'

// Solid
import { Link } from 'vike-i18n-routing/solid/Link'
```

## Basic usage

::: code-group

```vue [Vue]
<script setup>
import Link from 'vike-i18n-routing/vue/Link'
</script>

<template>
  <nav>
    <Link to="/">Home</Link>
    <Link to="/about">About</Link>
  </nav>
</template>
```

```tsx [React]
import { Link } from 'vike-i18n-routing/react/Link'

function Nav() {
  return (
    <nav>
      <Link to="/">Home</Link>
      <Link to="/about">About</Link>
    </nav>
  )
}
```

```tsx [Solid]
import { Link } from 'vike-i18n-routing/solid/Link'

function Nav() {
  return (
    <nav>
      <Link to="/">Home</Link>
      <Link to="/about">About</Link>
    </nav>
  )
}
```

:::

The current locale is picked up automatically from page context — no need to pass it explicitly.

## Props

| Prop       | Type                      | Description                                                             |
|------------|---------------------------|-------------------------------------------------------------------------|
| `to`       | `string`                  | Canonical route key (e.g. `'/about'`)                                   |
| `locale`   | `string`                  | Target locale. Defaults to the current page locale.                     |
| `params`   | `Record<string, string>`  | Route parameters to interpolate (e.g. `{ slug: 'cardiology' }`)        |
| `query`    | `Record<string, string>`  | Query string parameters                                                  |
| `absolute` | `boolean`                 | Return an absolute URL. Requires `baseUrl` in config.                   |
| `prefix`   | `boolean`                 | Override whether to include the locale prefix. Default: `true`.         |

All other HTML anchor attributes (`class`, `style`, `aria-*`, etc.) are forwarded to the underlying `<a>` element.

## Explicit locale

```vue
<!-- always link to the Russian version -->
<Link to="/about" locale="ru">О нас</Link>
```

## Route with params

```vue
<Link to="/specialities/:speciality" :params="{ speciality: 'cardiology' }">
  Cardiology
</Link>
```

## Query string

```vue
<Link to="/search" :query="{ q: 'vike' }">Search</Link>
<!-- renders: /en/search?q=vike -->
```

## Without locale prefix

```vue
<Link to="/about" :prefix="false">About</Link>
<!-- renders: /about -->
```

## Absolute URL

Requires `baseUrl` in your `I18nConfig`:

```ts
const i18nConfig = {
  baseUrl: 'https://example.com',
  // ...
}
```

```vue
<Link to="/about" :absolute="true">About</Link>
<!-- renders: https://example.com/en/about -->
```

## Under the hood

`<Link>` is a thin wrapper around `localizePath()` from `useI18nRoute`. If you need more control, use `localizePath()` directly:

```vue
<a :href="localizePath('/about')">About</a>
```

See [useI18nRoute](/guide/use-i18n-route) for the full API.
