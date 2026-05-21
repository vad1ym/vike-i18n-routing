<script setup lang="ts">
import { useData } from 'vike-vue/useData'
import { usePageContext } from 'vike-vue/usePageContext'

const data = useData<{ requestedFocus: string | null, currentUrl: string }>()
const pageContext = usePageContext()
</script>

<template>
  <div>
    <p>Services runtime fixture</p>
    <code>{{ data.currentUrl }}</code>
    <pre>{{ pageContext.i18nRoute.paramVariants }}</pre>
    <pre>{{ pageContext.i18nRoute.queryVariants }}</pre>
  </div>
</template>
