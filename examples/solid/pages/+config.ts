import vikeSolid from 'vike-solid/config'
import vikeI18n from 'vike-i18n-routing/config'
import type { Config } from 'vike/types'
import type { I18nConfig } from 'vike-i18n-routing'

export default {
  extends: [vikeSolid, vikeI18n],

  i18n: {
    defaultLocale: 'en',
    locales: ['ru', 'en'],
    prefixDefaultLocale: false,
    routes: {
      '/': { ru: '/', en: '/' },
      '/about': { ru: '/o-nas', en: '/about' },
      '/specialities': { ru: '/specialnosti', en: '/specialities' },
      '/specialities/:speciality': {
        ru: '/specialnosti/:speciality',
        en: '/specialities/:speciality',
      },
    },
  } satisfies I18nConfig,
} satisfies Config
