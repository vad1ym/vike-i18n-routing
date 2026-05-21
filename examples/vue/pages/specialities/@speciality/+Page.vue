<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useData } from 'vike-vue/useData'
import { usePageContext } from 'vike-vue/usePageContext'

const { t } = useI18n({ useScope: 'global' })
const pageContext = usePageContext()
const data = useData()

const speciality = computed(() => data.speciality)
</script>

<template>
  <div>
    <h1>{{ t('speciality.title', { speciality }) }}</h1>
    <p>{{ data.description }}</p>
    <p>
      {{ t('speciality.currentUrl') }}
      <code>{{ pageContext.i18nRoute.currentLocaleUrl }}</code>
    </p>

    <pre>{{ data }}</pre>
  </div>
</template>
