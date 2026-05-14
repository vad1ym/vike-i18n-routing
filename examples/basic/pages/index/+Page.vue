<script setup>
import { usePageContext } from 'vike-vue/usePageContext';

const pageContext = usePageContext()
</script>

<template>
  <div>
    <div>Current locale {{ pageContext.locale }}</div>
    <h1>Home</h1>
    <nav>
      <a href="/ru">RU</a> |
      <a href="/en">EN</a>
    </nav>
    <nav>
      <a href="/ru/o-nas">О нас (ru)</a> |
      <a href="/en/about">About (en)</a>
    </nav>

    <nav>
      <a :href="pageContext.i18nRoute.localizePath('/about', 'ru')">RU Localized</a> |
      <a :href="pageContext.i18nRoute.localizePath('/about', 'en')">EN Localized</a>
    </nav>

    <pre>{{ pageContext.i18nRoute }}</pre>
  </div>
</template>
