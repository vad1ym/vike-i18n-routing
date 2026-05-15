import type { I18nConfig } from 'vike-i18n-routing'

export const i18nConfig = {
  defaultLocale: 'en',
  locales: ['en', 'ru'],
  prefixDefaultLocale: false,
  routes: {
    '/': { en: '/', ru: '/' },
    '/about': { en: '/about', ru: '/o-nas' },
    '/specialities': { en: '/specialities', ru: '/specialnosti' },
  },
} satisfies I18nConfig
