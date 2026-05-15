<script setup>
import { computed, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePageContext } from 'vike-vue/usePageContext'

const pageContext = usePageContext()
const { t, locale } = useI18n({ useScope: 'global' })

const currentLocale = computed(() => pageContext.locale ?? 'en')
const currentPath = computed(() => pageContext.i18nRoute.routeConfig.vikeUrl)
const locales = computed(() => Object.keys(pageContext.i18nRoute.localeConfig.locales))

watchEffect(() => {
  locale.value = currentLocale.value
})

function switchLocale(locale) {
  return pageContext.i18nRoute.localizePath(currentPath.value, locale, { prefixDefaultLocale: true })
}

function localize(path) {
  return pageContext.i18nRoute.localizePath(path, currentLocale.value)
}
</script>

<template>
  <div class="layout">
    <header class="header">
      <div>
        <a class="brand" :href="localize('/')">{{ t('layout.brand') }}</a>
      </div>

      <nav class="nav">
        <a :href="localize('/')">{{ t('layout.home') }}</a>
        <a :href="localize('/about')">{{ t('layout.about') }}</a>
        <a :href="localize('/specialities')">{{ t('layout.specialities') }}</a>
      </nav>

      <nav class="locale-switcher" :aria-label="t('layout.switchLocale')">
        <a
          v-for="locale in locales"
          :key="locale"
          :href="switchLocale(locale)"
          :class="{ active: locale === currentLocale }"
        >
          {{ locale.toUpperCase() }}
        </a>
      </nav>
    </header>

    <main class="content">
      <slot />
    </main>

    <footer>
      <pre>{{ pageContext.i18nRoute }}</pre>
    </footer>
  </div>
</template>

<style scoped>
.layout {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px;
  font-family: "Helvetica Neue", Arial, sans-serif;
}

.header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 16px;
  margin-bottom: 24px;
  border-bottom: 1px solid #d4d4d8;
}

.brand {
  color: inherit;
  font-size: 20px;
  font-weight: 700;
  text-decoration: none;
}

.nav,
.locale-switcher {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.nav a,
.locale-switcher a {
  color: #0f172a;
}

.locale-switcher a.active {
  font-weight: 700;
  text-decoration: none;
}

.content {
  display: grid;
  gap: 16px;
}
</style>
