import { getI18nConfig } from './pageContext'
import { createI18nRouter, localizeCanonicalPath } from './router'
import { buildRoutePath } from './route-patterns'
import type {
  I18nPageContext,
  I18nRoute,
  LocaleCode,
  LocalizedPathOptions,
  ParamVariantConfig,
  QueryVariantConfig,
  RouteQueryVariants,
  RouteParamVariants,
} from './types'

type ParamVariants = Map<string, ParamVariantConfig>
type QueryVariants = Map<string, QueryVariantConfig>

export type UseI18nRouteResult = {
  locale: LocaleCode
  localeConfig: I18nRoute['localeConfig']
  domainConfig: I18nRoute['domainConfig']
  routeConfig: I18nRoute['routeConfig']
  setRouteParamVariants: (paramName: string, variants: RouteParamVariants) => void
  setRouteQueryVariants: (paramName: string, variants: RouteQueryVariants) => void
  localizePath: {
    (routeKey: string, locale?: LocaleCode, options?: LocalizedPathOptions): string
    (routeKey: string, options?: LocalizedPathOptions): string
  }
}

export function useI18nRoute(
  pageContext: I18nPageContext & {
    i18nRoute: I18nRoute
    i18nParamVariants?: Record<string, ParamVariantConfig>
    i18nQueryVariants?: Record<string, QueryVariantConfig>
  },
): UseI18nRouteResult {
  const i18n = getI18nConfig(pageContext)

  // On client hydration, i18nRoute is created fresh by onBeforeRoute without runtime variants.
  // passToClient transfers them separately and they are restored here.
  if (
    (
      (pageContext.i18nParamVariants && Object.keys(pageContext.i18nParamVariants).length > 0) ||
      (pageContext.i18nQueryVariants && Object.keys(pageContext.i18nQueryVariants).length > 0)
    ) &&
    Object.keys(pageContext.i18nRoute.routeConfig.paramVariants ?? {}).length === 0 &&
    Object.keys(pageContext.i18nRoute.routeConfig.queryVariants ?? {}).length === 0
  ) {
    const paramVariants = new Map(Object.entries(pageContext.i18nParamVariants ?? {}))
    const queryVariants = new Map(Object.entries(pageContext.i18nQueryVariants ?? {}))
    const restored = createI18nRouter(
      pageContext.urlOriginal,
      pageContext,
      paramVariants,
      queryVariants,
    )
    pageContext.i18nRoute.routeConfig = restored.routeConfig
    pageContext.i18nRoute.localeConfig = restored.localeConfig
  }

  const getParamVariants = (): ParamVariants =>
    new Map(Object.entries(pageContext.i18nRoute.routeConfig.paramVariants ?? {}))
  const getQueryVariants = (): QueryVariants =>
    new Map(Object.entries(pageContext.i18nRoute.routeConfig.queryVariants ?? {}))

  return {
    get locale() { return pageContext.i18nRoute.localeConfig.currentLocale },
    get localeConfig() { return pageContext.i18nRoute.localeConfig },
    get domainConfig() { return pageContext.i18nRoute.domainConfig },
    get routeConfig() { return pageContext.i18nRoute.routeConfig },

    setRouteParamVariants(paramName, variants) {
      const paramVariants = getParamVariants()
      const queryVariants = getQueryVariants()
      paramVariants.set(paramName, { variants })
      const next = createI18nRouter(
        pageContext.urlOriginal,
        pageContext,
        paramVariants,
        queryVariants,
      )
      // Mutate in place so that the vike pageContext reference stays the same
      // and passToClient picks up the updated routeConfig.
      pageContext.i18nRoute.routeConfig = next.routeConfig
      pageContext.i18nRoute.localeConfig = next.localeConfig
    },

    setRouteQueryVariants(paramName, variants) {
      const paramVariants = getParamVariants()
      const queryVariants = getQueryVariants()
      queryVariants.set(paramName, { variants })
      const next = createI18nRouter(
        pageContext.urlOriginal,
        pageContext,
        paramVariants,
        queryVariants,
      )
      pageContext.i18nRoute.routeConfig = next.routeConfig
      pageContext.i18nRoute.localeConfig = next.localeConfig
    },

    localizePath(routeKey: string, localeOrOptions?: LocaleCode | LocalizedPathOptions, options?: LocalizedPathOptions): string {
      const resolvedLocale = typeof localeOrOptions === 'string' ? localeOrOptions : undefined
      const resolvedOptions = typeof localeOrOptions === 'object' ? localeOrOptions : options
      const targetLocale = resolvedLocale ?? pageContext.i18nRoute.localeConfig.currentLocale

      // Merge inline variants (scoped to this call) on top of globally registered ones
      const paramVariants = getParamVariants()
      if (resolvedOptions?.paramVariants) {
        for (const [name, variants] of Object.entries(resolvedOptions.paramVariants)) {
          paramVariants.set(name, { variants })
        }
      }
      const queryVariants = getQueryVariants()
      if (resolvedOptions?.queryVariants) {
        for (const [name, variants] of Object.entries(resolvedOptions.queryVariants)) {
          queryVariants.set(name, { variants })
        }
      }

      // Interpolate params into the route key before passing to the router.
      // If paramVariants are provided, derive canonical param values from the defaultLocale variant
      // so the route pattern gets filled in automatically.
      const defaultLocale = pageContext.i18nRoute.localeConfig.defaultLocale
      const variantParams = resolvedOptions?.paramVariants
        ? Object.fromEntries(
            Object.entries(resolvedOptions.paramVariants).map(([name, variants]) => [
              name,
              variants[defaultLocale] ?? Object.values(variants)[0],
            ]),
          )
        : undefined
      const interpolatedParams = { ...variantParams, ...resolvedOptions?.params }
      const hasParams = Object.keys(interpolatedParams).length > 0
      const resolvedRouteKey = hasParams
        ? buildRoutePath(routeKey, interpolatedParams)
        : routeKey

      const canonicalPath = createI18nRouter(resolvedRouteKey, pageContext, paramVariants, queryVariants).routeConfig.canonicalUrl

      const localizedPath = localizeCanonicalPath(
        i18n.routes,
        paramVariants,
        canonicalPath,
        queryVariants,
        targetLocale,
        pageContext.i18nRoute.localeConfig,
        resolvedOptions,
      )

      if (!resolvedOptions?.query) return localizedPath

      // Localize query values via queryVariants, then append as search string
      const localeConfig = pageContext.i18nRoute.localeConfig
      const searchParams = new URLSearchParams()
      for (const [key, value] of Object.entries(resolvedOptions.query)) {
        const variants = queryVariants.get(key)?.variants
        const localized = variants?.[targetLocale] && variants[localeConfig.defaultLocale] === value
          ? variants[targetLocale]
          : variants
            ? Object.values(variants).includes(value)
              ? variants[targetLocale] ?? value
              : value
            : value
        searchParams.set(key, localized)
      }

      const search = searchParams.toString()
      return search ? `${localizedPath}?${search}` : localizedPath
    },
  }
}
