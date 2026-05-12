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
  </div>
</template>
