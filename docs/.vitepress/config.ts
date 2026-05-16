import { defineConfig } from 'vitepress'

export default defineConfig({
  base: '/vike-i18n-routing/',
  lang: 'en-US',
  title: 'vike-i18n-routing',
  description: 'Documentation for i18n routing in Vike',
  cleanUrls: true,
  lastUpdated: true,

  themeConfig: {
    logo: {
      text: 'vike-i18n-routing',
    },
    nav: [
      { text: 'Docs', link: '/' },
      { text: 'Quick Start', link: '/guide/quick-start' },
      { text: 'API', link: '/guide/use-i18n-route' },
      { text: 'Recipes', link: '/guide/recipes/' },
    ],
    sidebar: [
      {
        text: 'Getting Started',
        items: [
          { text: 'Overview', link: '/' },
          { text: 'Quick Start', link: '/guide/quick-start' },
          { text: 'Base Config', link: '/guide/base-config' },
        ],
      },
      {
        text: 'Core Concepts',
        items: [
          { text: 'Getting Current Locale', link: '/guide/current-locale' },
          { text: 'Usage On Client', link: '/guide/client-usage' },
          { text: 'I18n Routes', link: '/guide/i18n-routes' },
          { text: 'Params Translation', link: '/guide/params-translation' },
          { text: 'Redirects', link: '/guide/redirects' },
          { text: 'Domains', link: '/guide/domains' },
        ],
      },
      {
        text: 'Runtime API',
        items: [
          { text: 'useI18nRoute', link: '/guide/use-i18n-route' },
          { text: 'routeConfig', link: '/guide/route-config' },
          { text: 'localeConfig', link: '/guide/locale-config' },
          { text: 'domainConfig', link: '/guide/domain-config' },
        ],
      },
      {
        text: 'Recipes',
        items: [
          { text: 'Overview', link: '/guide/recipes/' },
          { text: 'SEO Alternates', link: '/guide/recipes/seo-alternates' },
          { text: 'Locale Switcher', link: '/guide/recipes/locale-switcher' },
          { text: 'Navigation Links', link: '/guide/recipes/navigation-links' },
          { text: 'Static Generation', link: '/guide/recipes/static-generation' },
          { text: 'Param Redirects', link: '/guide/recipes/param-redirects' },
          { text: 'Default Locale Without Prefix', link: '/guide/recipes/default-locale-without-prefix' },
          { text: 'Disable Locale Cookie', link: '/guide/recipes/disable-locale-cookie' },
        ],
      },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/vad1ym/vike-i18n-routing' },
    ],
    search: {
      provider: 'local',
    },
    outline: {
      level: [2, 3],
      label: 'On this page',
    },
    docFooter: {
      prev: 'Previous',
      next: 'Next',
    },
    sidebarMenuLabel: 'Menu',
    returnToTopLabel: 'Back to top',
    darkModeSwitchLabel: 'Appearance',
    lightModeSwitchTitle: 'Switch to light theme',
    darkModeSwitchTitle: 'Switch to dark theme',
  },

  head: [
    ['meta', { name: 'theme-color', content: '#c96b36' }],
  ],
})
