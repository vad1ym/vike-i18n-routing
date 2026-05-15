<script setup>
import { computed, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePageContext } from 'vike-vue/usePageContext'
import { useI18nRoute } from 'vike-i18n-routing/vue'

const { t, locale } = useI18n({ useScope: 'global' })
const pageContext = usePageContext()
const { locale: currentLocale, localeConfig, routeConfig, localizePath } = useI18nRoute(pageContext)

const currentPath = computed(() => routeConfig.value.canonicalUrl)
const locales = computed(() => Object.keys(localeConfig.value.locales))

watchEffect(() => {
  locale.value = currentLocale.value
})

function switchLocale(l) {
  return localizePath(currentPath.value, l, { prefixDefaultLocale: true })
}

function localize(path) {
  return localizePath(path)
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
      <pre>{{ routeConfig }}</pre>
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
