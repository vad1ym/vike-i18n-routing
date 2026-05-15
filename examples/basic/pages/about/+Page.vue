<script setup>
import { useI18n } from 'vue-i18n'
import { usePageContext } from 'vike-vue/usePageContext'

const { t } = useI18n({ useScope: 'global' })
const pageContext = usePageContext()
</script>

<template>
  <div>
    <h1>{{ t('about.title') }}</h1>
    <p>{{ t('about.body') }}</p>
  </div>
</template>
