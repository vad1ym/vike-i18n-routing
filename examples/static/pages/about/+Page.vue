<script setup>
import { usePageContext } from 'vike-vue/usePageContext'
import { getMessages } from '../../messages'

const messages = getMessages(usePageContext().locale)
</script>

<template>
  <section class="panel">
    <h1>{{ messages.about.title }}</h1>
    <p>{{ messages.about.body }}</p>
  </section>
</template>

<style scoped>
.panel {
  padding: 24px;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  background: #fff;
}
</style>
