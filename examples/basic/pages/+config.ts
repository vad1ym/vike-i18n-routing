import vikeVue from 'vike-vue/config'
import vikeI18n from 'vike-i18n-routing/config'
import type { Config } from 'vike/types'
import type { I18nConfig } from 'vike-i18n-routing'

export default {
  extends: [vikeVue, vikeI18n],

  i18n: {
    defaultLocale: 'en',

    locales: ['ru', 'en'],

    prefixDefaultLocale: false,

    routes: {
      '/': { ru: '/', en: '/' },
      '/about': { ru: '/o-nas', en: '/about' },
    },
  } satisfies I18nConfig,

} satisfies Config
