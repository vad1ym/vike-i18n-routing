import type { I18nConfig } from '../core/types'

export {}

declare global {
  namespace Vike {
    interface Config {
      i18n?: I18nConfig
    }

    interface PageContext {
      locale: string
      i18nRoute: import('../core/types').I18nRoute
    }
  }
}
