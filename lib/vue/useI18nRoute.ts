import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useI18nRoute as coreUseI18nRoute } from '../core/useI18nRoute'
import type { I18nRoute } from '../core/types'
import type { I18nPageContext } from '../core/types'

type PageContextWithI18nRoute = I18nPageContext & { i18nRoute: I18nRoute }

export function useI18nRoute(pageContext: MaybeRefOrGetter<PageContextWithI18nRoute>) {
  const result = computed(() => coreUseI18nRoute(toValue(pageContext)))

  const locale = computed(() => result.value.locale)
  const localeConfig = computed(() => result.value.localeConfig)
  const domainConfig = computed(() => result.value.domainConfig)
  const routeConfig = computed(() => result.value.routeConfig)

  const setRouteParamVariants = (...args: Parameters<typeof result.value.setRouteParamVariants>) =>
    result.value.setRouteParamVariants(...args)

  const localizePath = (...args: Parameters<typeof result.value.localizePath>) =>
    result.value.localizePath(...args)

  return { locale, localeConfig, domainConfig, routeConfig, setRouteParamVariants, localizePath }
}
