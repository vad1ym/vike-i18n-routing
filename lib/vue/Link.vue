<script setup lang="ts">
import { usePageContext } from 'vike-vue/usePageContext'
import { useI18nRoute } from 'vike-i18n-routing'
import type { LocaleCode, LocalizedPathOptions } from 'vike-i18n-routing'

const {
  to,
  locale,
  params,
  query,
  absolute,
  prefix,
  ...attrs
} = defineProps<{
  to: string
  locale?: LocaleCode
  params?: Record<string, string>
  query?: Record<string, string>
  absolute?: boolean
  prefix?: boolean
  [key: string]: unknown
}>()

const pageContext = usePageContext()
const { localizePath } = useI18nRoute(pageContext)

function href() {
  const options: LocalizedPathOptions = {}
  if (params) options.params = params
  if (query) options.query = query
  if (absolute !== undefined) options.absolute = absolute
  if (prefix !== undefined) options.prefix = prefix
  return localizePath(to, locale, Object.keys(options).length ? options : undefined)
}
</script>

<template>
  <a v-bind="attrs" :href="href()"><slot /></a>
</template>
