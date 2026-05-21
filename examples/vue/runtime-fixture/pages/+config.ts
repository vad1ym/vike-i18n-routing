import vikeVue from 'vike-vue/config'
import vikeI18n from 'vike-i18n-routing/config'
import type { Config } from 'vike/types'
import type { I18nConfig } from 'vike-i18n-routing'

export default {
  extends: [vikeVue, vikeI18n],

  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ru'],
    prefixDefaultLocale: false,
    localeCookie: 'locale',
    routes: {
      '/about': { en: '/about', ru: '/o-nas' },
      '/services/:category': {
        en: '/services/:category',
        ru: '/uslugi/:category',
      },
    },
  } satisfies I18nConfig,
} satisfies Config
