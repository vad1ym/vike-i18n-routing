import type { I18nConfig } from '../core/types'

export {}

declare global {
  namespace Vike {
    interface Config {
      i18n?: I18nConfig
    }

    interface PageContext {
      locale: string
      canonical: string
      i18nDomain?: {
        domain: string
        meta?: Record<string, any>
      }
    }
  }
}
