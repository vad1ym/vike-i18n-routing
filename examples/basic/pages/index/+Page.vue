<script setup>
import { useI18n } from 'vue-i18n'
import { usePageContext } from 'vike-vue/usePageContext'

const { t } = useI18n({ useScope: 'global' })
const pageContext = usePageContext()
</script>

<template>
  <div>
    <h1>{{ t('home.title') }}</h1>
    <p>{{ t('home.currentLocale', { locale: pageContext.locale }) }}</p>
    <p>
      {{ t('home.tryDynamicList') }}
      <a :href="pageContext.i18nRoute.localizePath('/specialities', pageContext.locale)">
        {{ t('layout.specialities') }}
      </a>
    </p>
  </div>
</template>
