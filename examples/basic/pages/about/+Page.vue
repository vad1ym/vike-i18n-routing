<script setup>
import { usePageContext } from 'vike-vue/usePageContext';

const pageContext = usePageContext()
</script>

<template>
  <div>
    <h1>About</h1>
    <a href="/ru">← Home (ru)</a> |
    <a href="/en">← Home (en)</a>

    <pre>{{ pageContext.i18nRoute }}</pre>
  </div>
</template>
