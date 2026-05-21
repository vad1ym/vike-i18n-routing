<script setup>
import { useData } from 'vike-vue/useData'
import { usePageContext } from 'vike-vue/usePageContext'
import { useI18nRoute } from 'vike-i18n-routing'
import { computed } from 'vue'
import { getMessages } from '../../../messages'

const data = useData()
const pageContext = usePageContext()
const { localizePath } = useI18nRoute(pageContext)
const messages = computed(() => getMessages(pageContext.locale))
</script>

<template>
  <section class="panel">
    <a class="back" :href="localizePath('/products')">{{ messages.product.back }}</a>
    <h1>{{ data.title }}</h1>
    <p>{{ data.description }}</p>
    <p>{{ messages.product.category }}: {{ data.category }}</p>
    <p>{{ messages.product.price }}: {{ data.price }}</p>
    <p>{{ messages.product.source }}: {{ data.source }}</p>
    <code>{{ pageContext.i18nRoute.currentLocaleUrl }}</code>
  </section>
</template>

<style scoped>
.panel {
  padding: 24px;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  background: #fff;
}

.back {
  display: inline-flex;
  margin-bottom: 12px;
  font-weight: 700;
  color: #0f172a;
}
</style>
