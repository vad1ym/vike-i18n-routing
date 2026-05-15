import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useI18nRoute as coreUseI18nRoute } from '../core/useI18nRoute'
import type { UseI18nRouteResult } from '../core/useI18nRoute'
import type { I18nRoute } from '../core/types'
import type { I18nPageContext } from '../core/types'

type PageContextWithI18nRoute = I18nPageContext & { i18nRoute: I18nRoute }

export function useI18nRoute(pageContext: MaybeRefOrGetter<PageContextWithI18nRoute>) {
  const result = computed(() => coreUseI18nRoute(toValue(pageContext)))

  const locale = computed(() => result.value.locale)
  const localeConfig = computed(() => result.value.localeConfig)
  const domainConfig = computed(() => result.value.domainConfig)
  const routeConfig = computed(() => result.value.routeConfig)

  const setRouteParamVariants: UseI18nRouteResult['setRouteParamVariants'] = (paramName, variants) =>
    result.value.setRouteParamVariants(paramName, variants)
  const setRouteQueryVariants: UseI18nRouteResult['setRouteQueryVariants'] = (paramName, variants) =>
    result.value.setRouteQueryVariants(paramName, variants)

  const localizePath = ((routeKey: string, localeOrOptions?: string | Record<string, unknown>, options?: Record<string, unknown>) =>
    result.value.localizePath(routeKey, localeOrOptions as any, options as any)) as UseI18nRouteResult['localizePath']

  return { locale, localeConfig, domainConfig, routeConfig, setRouteParamVariants, setRouteQueryVariants, localizePath }
}
