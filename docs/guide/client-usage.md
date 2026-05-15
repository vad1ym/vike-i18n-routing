# Usage On Client

This package handles routing only. Text translation can be handled by `vue-i18n` or another i18n library.

## Vue + `vue-i18n`

The example app syncs the resolved route locale with `vue-i18n`.

```vue
<script setup lang="ts">
import { watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePageContext } from 'vike-vue/usePageContext'
import { useI18nRoute } from 'vike-i18n-routing/vue'

const { locale } = useI18n({ useScope: 'global' })
const pageContext = usePageContext()
const { locale: currentLocale, localizePath } = useI18nRoute(pageContext)

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

Next: [I18n Routes](/guide/i18n-routes)
