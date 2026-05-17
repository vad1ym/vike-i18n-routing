<script setup>
import { useI18n } from 'vue-i18n'
import { usePageContext } from 'vike-vue/usePageContext'
import { useI18nRoute } from 'vike-i18n-routing'

const { t } = useI18n({ useScope: 'global' })
const pageContext = usePageContext()
const { localizePath } = useI18nRoute(pageContext)
const locale = pageContext.locale
</script>

<template>
  <div>
    <h1>{{ t('home.title') }}</h1>
    <p>{{ t('home.currentLocale', { locale }) }}</p>
    <p>
      {{ t('home.tryDynamicList') }}
      <a :href="localizePath('/specialities', locale)">
        {{ t('layout.specialities') }}
      </a>
    </p>
  </div>
</template>
