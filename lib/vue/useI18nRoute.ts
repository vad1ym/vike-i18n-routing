import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { localizePath as coreLocalizePath } from '../core/useI18nRoute'
import type { I18nRoute } from '../core/types'
import type { I18nPageContext } from '../core/types'
import { usePageContext } from 'vike-vue/usePageContext'

type PageContextWithI18nRoute = I18nPageContext & { i18nRoute: I18nRoute }

export function useI18nRoute() {
  const pageContext = usePageContext()
  return {
    i18nRoute: computed(() => pageContext.i18nRoute),
    localizePath: (routeKey: string, localeOrOptions?: string | Record<string, unknown>, options?: Record<string, unknown>) =>
      coreLocalizePath(pageContext, routeKey, localeOrOptions as any, options as any)
  }
}
