<script setup>
import { usePageContext } from 'vike-vue/usePageContext'
import { useData } from 'vike-vue/useData'
import { useI18nRoute } from 'vike-i18n-routing/vue'
import { computed } from 'vue'
import { getMessages } from '../../messages'

const { locale } = useI18nRoute(usePageContext())
const data = useData()
const messages = computed(() => getMessages(locale.value))
</script>

<template>
  <section class="panel">
    <h1>{{ messages.catalog.title }}</h1>
    <p>{{ messages.catalog.body }}</p>

    <ul class="list">
      <li v-for="item in data.specialities" :key="item.title.en">
        <strong>{{ item.title[locale] }}</strong>
        <p>{{ item.description[locale] }}</p>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.panel {
  padding: 24px;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  background: #fff;
}

.list {
  display: grid;
  gap: 16px;
  padding: 0;
  margin-top: 20px;
  list-style: none;
}

.list strong {
  color: #0f172a;
}
</style>
