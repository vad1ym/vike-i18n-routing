<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useData } from 'vike-vue/useData'
import { usePageContext } from 'vike-vue/usePageContext'

const { t } = useI18n({ useScope: 'global' })
const pageContext = usePageContext()
const data = useData()

const currentLocale = computed(() => pageContext.locale ?? 'en')
</script>

<template>
  <div>
    <h1>{{ t('specialities.title') }}</h1>
    <p>{{ t('specialities.body') }}</p>

    <ul class="list">
      <li v-for="item in data.specialities" :key="item.slug">
        <a :href="pageContext.i18nRoute.localizePath(`/specialities/${item.variants.speciality[currentLocale]}`)">
          {{ item.title[currentLocale] }}
        </a>
        <p>{{ item.description[currentLocale] }}</p>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.list {
  display: grid;
  gap: 16px;
  padding: 0;
  list-style: none;
}
</style>
