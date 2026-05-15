<script setup>
import { useI18n } from 'vue-i18n'
import { useData } from 'vike-vue/useData'
import { usePageContext } from 'vike-vue/usePageContext'
import { useI18nRoute } from 'vike-i18n-routing/vue'

const { t } = useI18n({ useScope: 'global' })
const data = useData()
const { locale, localizePath } = useI18nRoute(usePageContext())

function filterHref(filter) {
  return localizePath(`/specialities?focus=${filter.variants[locale.value]}`)
}
</script>

<template>
  <div>
    <h1>{{ t('specialities.title') }}</h1>
    <p>{{ t('specialities.body') }}</p>

    <div class="filters">
      <a
        :href="localizePath('/specialities')"
        :class="{ active: data.activeFocus === null }"
      >
        {{ t('specialities.filters.all') }}
      </a>
      <a
        v-for="filter in data.filters"
        :key="filter.key"
        :href="filterHref(filter)"
        :class="{ active: data.activeFocus === filter.key }"
      >
        {{ t(`specialities.filters.${filter.key}`) }}
      </a>
    </div>

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
.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}

.filters a.active {
  font-weight: 700;
  text-decoration: none;
}

.list {
  display: grid;
  gap: 16px;
  padding: 0;
  list-style: none;
}
</style>
