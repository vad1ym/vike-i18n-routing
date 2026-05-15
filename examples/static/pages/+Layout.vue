<script setup>
import { computed } from 'vue'
import { usePageContext } from 'vike-vue/usePageContext'
import { useI18nRoute } from 'vike-i18n-routing/vue'
import { getMessages } from '../messages'

const pageContext = usePageContext()
const { locale: currentLocale, localeConfig, routeConfig, localizePath } = useI18nRoute(pageContext)

const currentPath = computed(() => routeConfig.value.canonicalUrl)
const locales = computed(() => Object.keys(localeConfig.value.locales))
const messages = computed(() => getMessages(currentLocale.value))

function switchLocale(targetLocale) {
  return localizePath(currentPath.value, targetLocale, { prefix: true })
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
        <a :href="localizePath('/specialities')">{{ messages.layout.catalog }}</a>
      </nav>

      <nav class="locale-switcher" :aria-label="messages.layout.switchLocale">
        <a
          v-for="targetLocale in locales"
          :key="targetLocale"
          :href="switchLocale(targetLocale)"
          :class="{ active: targetLocale === currentLocale }"
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
    radial-gradient(circle at top right, rgba(251, 191, 36, 0.2), transparent 35%),
    linear-gradient(135deg, #fffaf0, #eff6ff);
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
  background: #111827;
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
