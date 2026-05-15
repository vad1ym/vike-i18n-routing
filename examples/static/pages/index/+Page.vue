<script setup>
import { usePageContext } from 'vike-vue/usePageContext'
import { useI18nRoute } from 'vike-i18n-routing/vue'
import { getMessages } from '../../messages'

const { locale, localizePath } = useI18nRoute(usePageContext())
const messages = getMessages(locale.value)
</script>

<template>
  <section class="panel">
    <h1>{{ messages.home.title }}</h1>
    <p>{{ messages.home.body }}</p>
    <a class="cta" :href="localizePath('/specialities')">
      {{ messages.home.cta }}
    </a>
  </section>
</template>

<style scoped>
.panel {
  padding: 24px;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  background: #fff;
}

.cta {
  display: inline-flex;
  margin-top: 16px;
  color: #0f172a;
  font-weight: 700;
}
</style>
