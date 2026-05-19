# Usage On Client

This package handles routing only. Text translation can be handled by `vue-i18n`, `react-intl`, a small Solid helper, or another i18n library.

## Vue + `vue-i18n`

The example app syncs the resolved route locale with `vue-i18n`.

```vue
<script setup lang="ts">
import { watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePageContext } from 'vike-vue/usePageContext'
import { useI18nRoute } from 'vike-i18n-routing'

const { locale } = useI18n({ useScope: 'global' })
const { i18nRoute, localizePath } = useI18nRoute(usePageContext())
const currentLocale = i18nRoute.localeConfig.currentLocale

watchEffect(() => {
  locale.value = currentLocale.value
})
</script>

<template>
  <a :href="localizePath('/about')">About</a>
</template>
```

## Initialize `vue-i18n`

```ts
import { createI18n } from 'vue-i18n'

export const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    en: { about: 'About' },
    ru: { about: 'О нас' },
  },
})
```

## Attach it to the app

```ts
import { i18n } from '../i18n'

export function onCreateApp(pageContext: Vike.PageContext) {
  i18n.global.locale.value = pageContext.locale ?? 'en'
  pageContext.app.use(i18n)
}
```

## React + `react-intl`

The React example uses `react-intl` and wraps the layout with an `IntlProvider`.

```tsx
import type { ReactNode } from 'react'
import { IntlProvider } from 'react-intl'
import { usePageContext } from 'vike-react/usePageContext'
import { messages } from '../messages'

export { Layout }

function Layout({ children }: { children: ReactNode }) {
  const pageContext = usePageContext()
  const locale = (pageContext.locale ?? 'en') as keyof typeof messages

  return (
    <IntlProvider locale={locale} messages={messages[locale]} defaultLocale="en">
      {children}
    </IntlProvider>
  )
}
```

Use `useI18nRoute` inside components:

```tsx
import { usePageContext } from 'vike-react/usePageContext'
import { useI18nRoute } from 'vike-i18n-routing'

const { i18nRoute, localizePath } = useI18nRoute(usePageContext())
```

Next: [I18n Routes](/guide/i18n-routes)
