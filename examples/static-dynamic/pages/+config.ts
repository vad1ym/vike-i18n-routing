import vikeVue from 'vike-vue/config'
import vikeI18n from 'vike-i18n-routing/config'
import type { Config } from 'vike/types'
import { i18nConfig } from '../i18nConfig'

export default {
  extends: [vikeVue, vikeI18n],
  prerender: true,
  i18n: i18nConfig,
} satisfies Config
