import type { I18nConfig } from 'vike-i18n-routing'

export const i18nConfig = {
  defaultLocale: 'en',
  locales: ['en', 'ru'],
  prefixDefaultLocale: false,
  routes: {
    '/': { en: '/', ru: '/' },
    '/about': { en: '/about', ru: '/o-proekte' },
    '/products': { en: '/products', ru: '/produkty' },
    '/products/:slug': { en: '/products/:slug', ru: '/produkty/:slug' },
  },
} satisfies I18nConfig
