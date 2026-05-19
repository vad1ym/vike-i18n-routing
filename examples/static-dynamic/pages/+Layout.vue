<script setup>
import { computed } from 'vue'
import { usePageContext } from 'vike-vue/usePageContext'
import { useI18nRoute } from 'vike-i18n-routing'
import { getMessages } from '../messages'

const pageContext = usePageContext()
const { routeConfig, localeConfig, localizePath } = useI18nRoute(pageContext)

const locales = computed(() => Object.keys(localeConfig.locales))
const messages = computed(() => getMessages(pageContext.locale))

function switchLocale(targetLocale) {
  return localizePath(routeConfig.canonicalUrl, targetLocale, {
    prefix: true,
    params: routeConfig.i18nUrlParams,
  })
}
</script>

<template>
  <div class="layout">
    <header class="hero">
      <div class="hero-copy">
        <a class="brand" :href="localizePath('/')">{{ messages.layout.brand }}</a>
        <span class="badge">{{ messages.layout.badge }}</span>
      </div>

      <nav class="nav">
        <a :href="localizePath('/')">{{ messages.layout.home }}</a>
        <a :href="localizePath('/about')">{{ messages.layout.about }}</a>
        <a :href="localizePath('/products')">{{ messages.layout.products }}</a>
      </nav>

      <nav class="locale-switcher" :aria-label="messages.layout.switchLocale">
        <a
          v-for="targetLocale in locales"
          :key="targetLocale"
          :href="switchLocale(targetLocale)"
          :class="{ active: targetLocale === pageContext.locale }"
        >
          {{ targetLocale.toUpperCase() }}
        </a>
      </nav>
    </header>

    <main class="content">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.layout {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px;
  color: #1f2937;
  font-family: "Helvetica Neue", Arial, sans-serif;
}

.hero {
  display: grid;
  gap: 16px;
  padding: 24px;
  margin-bottom: 24px;
  border: 1px solid #e5e7eb;
  border-radius: 24px;
  background:
    radial-gradient(circle at top right, rgba(56, 189, 248, 0.18), transparent 35%),
    linear-gradient(135deg, #f8fafc, #ecfeff);
}

.hero-copy {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.brand {
  color: inherit;
  font-size: 24px;
  font-weight: 700;
  text-decoration: none;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 999px;
  background: #0f172a;
  color: #fff;
  font-size: 13px;
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
  gap: 20px;
}
</style>
