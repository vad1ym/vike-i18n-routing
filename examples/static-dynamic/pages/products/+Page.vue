<script setup>
import { useData } from 'vike-vue/useData'
import { usePageContext } from 'vike-vue/usePageContext'
import { useI18nRoute } from 'vike-i18n-routing'
import { computed } from 'vue'
import { getMessages } from '../../messages'

const data = useData()
const pageContext = usePageContext()
const { localizePath } = useI18nRoute(pageContext)
const messages = computed(() => getMessages(pageContext.locale))
</script>

<template>
  <section class="panel">
    <h1>{{ messages.products.title }}</h1>
    <p>{{ messages.products.body }}</p>

    <ul class="list">
      <li v-for="product in data.products" :key="product.id">
        <strong>{{ product.title[pageContext.locale] }}</strong>
        <p>{{ product.description[pageContext.locale] }}</p>
        <p>{{ messages.products.category }}: {{ product.category }}</p>
        <p>{{ messages.products.price }}: ${{ product.price }}</p>
        <a
          class="link"
          :href="localizePath('/products/:slug', { params: { slug: product.slug } })"
        >
          {{ messages.products.cta }}
        </a>
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

.link {
  display: inline-flex;
  margin-top: 8px;
  font-weight: 700;
  color: #0f172a;
}
</style>
