<script setup>
import { useI18n } from 'vue-i18n'
import { useData } from 'vike-vue/useData'
import { usePageContext } from 'vike-vue/usePageContext'
import { useI18nRoute } from 'vike-i18n-routing/vue'

const { t } = useI18n({ useScope: 'global' })
const data = useData()
const { locale, localizePath } = useI18nRoute(usePageContext())
</script>

<template>
  <div>
    <h1>{{ t('specialities.title') }}</h1>
    <p>{{ t('specialities.body') }}</p>

    <ul class="list">
      <li v-for="item in data.specialities" :key="item.slug">
        <a :href="localizePath(`/specialities/${item.variants.speciality[locale]}`)">
          {{ item.title[locale] }}
        </a>
        <p>{{ item.description[locale] }}</p>
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
