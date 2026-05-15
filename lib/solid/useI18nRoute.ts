import { createMemo, type Accessor } from 'solid-js'
import { useI18nRoute as coreUseI18nRoute } from '../core/useI18nRoute'
import type { UseI18nRouteResult } from '../core/useI18nRoute'
import type { I18nPageContext, I18nRoute } from '../core/types'

type PageContextWithI18nRoute = I18nPageContext & { i18nRoute: I18nRoute }
type MaybeAccessor<T> = T | Accessor<T>

export function useI18nRoute(pageContext: MaybeAccessor<PageContextWithI18nRoute>) {
  const resolvedPageContext = () =>
    typeof pageContext === 'function'
      ? (pageContext as Accessor<PageContextWithI18nRoute>)()
      : pageContext

  const result = createMemo(() => coreUseI18nRoute(resolvedPageContext()))

  const locale = createMemo(() => result().locale)
  const localeConfig = createMemo(() => result().localeConfig)
  const domainConfig = createMemo(() => result().domainConfig)
  const routeConfig = createMemo(() => result().routeConfig)

  const setRouteParamVariants: UseI18nRouteResult['setRouteParamVariants'] = (paramName, variants) =>
    result().setRouteParamVariants(paramName, variants)
  const setRouteQueryVariants: UseI18nRouteResult['setRouteQueryVariants'] = (paramName, variants) =>
    result().setRouteQueryVariants(paramName, variants)

  const localizePath = ((routeKey: string, localeOrOptions?: string | Record<string, unknown>, options?: Record<string, unknown>) =>
    result().localizePath(routeKey, localeOrOptions as any, options as any)) as UseI18nRouteResult['localizePath']

  return {
    locale,
    localeConfig,
    domainConfig,
    routeConfig,
    setRouteParamVariants,
    setRouteQueryVariants,
    localizePath,
  }
}
