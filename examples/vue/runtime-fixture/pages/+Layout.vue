<script setup>
import { usePageContext } from 'vike-vue/usePageContext'

const pageContext = usePageContext()
</script>

<template>
  <div>
    <header>
      <h1>Vue Runtime Fixture</h1>
      <code>{{ pageContext.i18nRoute.currentLocaleUrl }}</code>
    </header>
    <main>
      <slot />
    </main>
    <pre>{{ pageContext.i18nRoute }}</pre>
  </div>
</template>
