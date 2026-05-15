import { getI18nConfig } from './pageContext'
import { createI18nRouter, localizeCanonicalPath } from './router'
import type {
  I18nPageContext,
  I18nRoute,
  LocaleCode,
  LocalizedPathOptions,
  ParamVariantConfig,
  RouteParamVariants,
} from './types'

type ParamVariants = Map<string, ParamVariantConfig>

export type UseI18nRouteResult = {
  locale: LocaleCode
  localeConfig: I18nRoute['localeConfig']
  domainConfig: I18nRoute['domainConfig']
  routeConfig: I18nRoute['routeConfig']
  setRouteParamVariants: (paramName: string, variants: RouteParamVariants) => void
  localizePath: {
    (routeKey: string, locale?: LocaleCode, options?: LocalizedPathOptions): string
    (routeKey: string, options?: LocalizedPathOptions): string
  }
}

export function useI18nRoute(pageContext: I18nPageContext & { i18nRoute: I18nRoute, i18nParamVariants?: Record<string, ParamVariantConfig> }): UseI18nRouteResult {
  const i18n = getI18nConfig(pageContext)

  // On client hydration, i18nRoute is created fresh by onBeforeRoute without paramVariants.
  // i18nParamVariants is passed separately via passToClient and used to restore them.
  if (
    pageContext.i18nParamVariants &&
    Object.keys(pageContext.i18nParamVariants).length > 0 &&
    Object.keys(pageContext.i18nRoute.routeConfig.paramVariants ?? {}).length === 0
  ) {
    const paramVariants = new Map(Object.entries(pageContext.i18nParamVariants))
    const restored = createI18nRouter(pageContext.i18nRoute.routeConfig.requestUrl, pageContext, paramVariants)
    pageContext.i18nRoute.routeConfig = restored.routeConfig
    pageContext.i18nRoute.localeConfig = restored.localeConfig
  }

  const getParamVariants = (): ParamVariants =>
    new Map(Object.entries(pageContext.i18nRoute.routeConfig.paramVariants ?? {}))

  return {
    get locale() { return pageContext.i18nRoute.localeConfig.currentLocale },
    get localeConfig() { return pageContext.i18nRoute.localeConfig },
    get domainConfig() { return pageContext.i18nRoute.domainConfig },
    get routeConfig() { return pageContext.i18nRoute.routeConfig },

    setRouteParamVariants(paramName, variants) {
      const paramVariants = getParamVariants()
      paramVariants.set(paramName, { variants })
      const next = createI18nRouter(pageContext.i18nRoute.routeConfig.requestUrl, pageContext, paramVariants)
      // Mutate in place so that the vike pageContext reference stays the same
      // and passToClient picks up the updated routeConfig.
      pageContext.i18nRoute.routeConfig = next.routeConfig
      pageContext.i18nRoute.localeConfig = next.localeConfig
    },

    localizePath(routeKey: string, localeOrOptions?: LocaleCode | LocalizedPathOptions, options?: LocalizedPathOptions): string {
      const resolvedLocale = typeof localeOrOptions === 'string' ? localeOrOptions : undefined
      const resolvedOptions = typeof localeOrOptions === 'object' ? localeOrOptions : options
      const targetLocale = resolvedLocale ?? pageContext.i18nRoute.localeConfig.currentLocale
      const paramVariants = getParamVariants()
      const canonicalPath = createI18nRouter(routeKey, pageContext, paramVariants).routeConfig.canonicalUrl

      return localizeCanonicalPath(i18n.routes, paramVariants, canonicalPath, targetLocale, pageContext.i18nRoute.localeConfig, resolvedOptions)
    },
  }
}
