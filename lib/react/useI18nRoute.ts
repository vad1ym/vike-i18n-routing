import { useCallback, useMemo } from 'react'
import { useI18nRoute as coreUseI18nRoute } from '../core/useI18nRoute'
import type { UseI18nRouteResult } from '../core/useI18nRoute'
import type { I18nPageContext, I18nRoute } from '../core/types'

type PageContextWithI18nRoute = I18nPageContext & { i18nRoute: I18nRoute }

export function useI18nRoute(pageContext: PageContextWithI18nRoute) {
  const result = useMemo(() => coreUseI18nRoute(pageContext), [pageContext])

  const locale = useMemo(() => result.locale, [result])
  const localeConfig = useMemo(() => result.localeConfig, [result])
  const domainConfig = useMemo(() => result.domainConfig, [result])
  const routeConfig = useMemo(() => result.routeConfig, [result])

  const setRouteParamVariants = useCallback<UseI18nRouteResult['setRouteParamVariants']>((paramName, variants) => {
    result.setRouteParamVariants(paramName, variants)
  }, [result])

  const setRouteQueryVariants = useCallback<UseI18nRouteResult['setRouteQueryVariants']>((paramName, variants) => {
    result.setRouteQueryVariants(paramName, variants)
  }, [result])

  const localizePath = useCallback(
    ((routeKey: string, localeOrOptions?: string | Record<string, unknown>, options?: Record<string, unknown>) => {
      return result.localizePath(routeKey, localeOrOptions as any, options as any)
    }) as UseI18nRouteResult['localizePath'],
    [result],
  )

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
