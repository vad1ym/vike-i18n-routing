import { getI18nConfig } from './pageContext'
import { createI18nRouter, createRouteDescriptor, getCompiledDomainRouting, localizeCanonicalPath, localizeCanonicalPathCached, localizeRouteDescriptor, localizeRouteDescriptorCached, localizeRouteKey, rebuildI18nRouteWithVariants } from './router'
import { buildRoutePath } from './route-patterns'
import { localizeNamedQueryValue } from './variants'
import type {
  I18nConfig,
  I18nPageContext,
  I18nRoute,
  LocaleCode,
  LocalizedPathOptions,
  ParamVariantConfig,
  QueryVariantConfig,
  RouteDescriptor,
  RouteKey,
  RouteQueryVariants,
  RouteParamVariants,
} from './types'

// O(1) check for non-empty object without allocating Object.keys()
function hasAnyKey(obj: Record<string, unknown> | undefined | null): boolean {
  if (!obj) return false
  for (const _ in obj) return true
  return false
}

type ParamVariants = Map<string, ParamVariantConfig>
type QueryVariants = Map<string, QueryVariantConfig>

const EMPTY_PARAM_VARIANTS_RECORD: Record<string, ParamVariantConfig> = {}
const EMPTY_QUERY_VARIANTS_RECORD: Record<string, QueryVariantConfig> = {}
const EMPTY_PARAM_VARIANTS_MAP: ParamVariants = new Map()
const EMPTY_QUERY_VARIANTS_MAP: QueryVariants = new Map()
const paramVariantMapCache = new WeakMap<Record<string, ParamVariantConfig>, ParamVariants>()
const queryVariantMapCache = new WeakMap<Record<string, QueryVariantConfig>, QueryVariants>()
const ROUTE_DESCRIPTOR_CACHE = Symbol('vike-i18n-route-descriptor-cache')

export type PageContextWithI18nRoute = I18nPageContext & {
  i18nRoute: I18nRoute
  i18nParamVariants?: Record<string, ParamVariantConfig>
  i18nQueryVariants?: Record<string, QueryVariantConfig>
  [ROUTE_DESCRIPTOR_CACHE]?: Map<string, BoundRouteDescriptor>
}

export type UseI18nRouteResult = {
  locale: LocaleCode
  localeConfig: I18nRoute['localeConfig']
  domainConfig: I18nRoute['domainConfig']
  routeConfig: I18nRoute['routeConfig']
  setRouteParamVariants: (paramName: string, variants: RouteParamVariants) => void
  setRouteQueryVariants: (paramName: string, variants: RouteQueryVariants) => void
  route: (routeKey: string) => BoundRouteDescriptor
  localizePath: {
    (routeKey: string | RouteDescriptor, locale?: LocaleCode, options?: LocalizedPathOptions): string
    (routeKey: string | RouteDescriptor, options?: LocalizedPathOptions): string
  }
}

export type BoundRouteDescriptor<TKey extends string = string> = Omit<RouteDescriptor, 'key'> & {
  key: TKey
  to: {
    (locale?: LocaleCode, options?: LocalizedPathOptions): string
    (options?: LocalizedPathOptions): string
  }
}

export type TypedUseI18nRouteResult<TConfig extends I18nConfig> = Omit<
  UseI18nRouteResult,
  'route' | 'localizePath'
> & {
  route: (routeKey: RouteKey<TConfig>) => BoundRouteDescriptor<RouteKey<TConfig>>
  localizePath: {
    (routeKey: RouteKey<TConfig> | RouteDescriptor, locale?: LocaleCode, options?: LocalizedPathOptions): string
    (routeKey: RouteKey<TConfig> | RouteDescriptor, options?: LocalizedPathOptions): string
  }
}

function getParamVariants(pageContext: PageContextWithI18nRoute): ParamVariants {
  return getCachedParamVariants(pageContext.i18nRoute.routeConfig.paramVariants ?? EMPTY_PARAM_VARIANTS_RECORD)
}

function getQueryVariants(pageContext: PageContextWithI18nRoute): QueryVariants {
  return getCachedQueryVariants(pageContext.i18nRoute.routeConfig.queryVariants ?? EMPTY_QUERY_VARIANTS_RECORD)
}

function getCachedParamVariants(record: Record<string, ParamVariantConfig>): ParamVariants {
  const cached = paramVariantMapCache.get(record)
  if (cached) return cached

  const created = new Map(Object.entries(record))
  paramVariantMapCache.set(record, created)
  return created
}

function getCachedQueryVariants(record: Record<string, QueryVariantConfig>): QueryVariants {
  const cached = queryVariantMapCache.get(record)
  if (cached) return cached

  const created = new Map(Object.entries(record))
  queryVariantMapCache.set(record, created)
  return created
}

function getRouteDescriptorCache(pageContext: PageContextWithI18nRoute): Map<string, BoundRouteDescriptor> {
  let cache = pageContext[ROUTE_DESCRIPTOR_CACHE]
  if (!cache) {
    cache = new Map()
    pageContext[ROUTE_DESCRIPTOR_CACHE] = cache
  }
  return cache
}

function getCachedRouteDescriptor(
  pageContext: PageContextWithI18nRoute,
  routeKey: string,
): BoundRouteDescriptor | undefined {
  return getRouteDescriptorCache(pageContext).get(routeKey)
}

function getEffectiveRouteIndex(pageContext: PageContextWithI18nRoute) {
  const i18n = getI18nConfig(pageContext)
  return getCompiledDomainRouting(i18n, pageContext.i18nRoute.domainConfig.domain).routeIndex
}

function createBoundRouteDescriptor(
  pageContext: PageContextWithI18nRoute,
  routeKey: string,
  effectiveRoutes = getEffectiveRouteIndex(pageContext),
): BoundRouteDescriptor {
  const cached = getCachedRouteDescriptor(pageContext, routeKey)
  if (cached) return cached

  const descriptor = createRouteDescriptor(effectiveRoutes, routeKey)
  const bound = {
    ...descriptor,
    to(localeOrOptions?: LocaleCode | LocalizedPathOptions, options?: LocalizedPathOptions): string {
      return localizeDescriptorPath(pageContext, descriptor, localeOrOptions, options)
    },
  }
  getRouteDescriptorCache(pageContext).set(routeKey, bound)
  return bound
}

function getDeclaredRouteDescriptor(
  pageContext: PageContextWithI18nRoute,
  routeKey: string,
): BoundRouteDescriptor | undefined {
  const cached = getCachedRouteDescriptor(pageContext, routeKey)
  if (cached) return cached

  const effectiveRoutes = getEffectiveRouteIndex(pageContext)
  if (!effectiveRoutes.routes[routeKey]) return undefined
  return createBoundRouteDescriptor(pageContext, routeKey, effectiveRoutes)
}

function isParamsOnlyOptions(options: LocalizedPathOptions | undefined): boolean {
  if (!options) return false
  if (options.prefix !== undefined) return false
  if (options.query) return false
  if (options.paramVariants) return false
  if (options.queryVariants) return false
  return true
}

function hasNoResolvedVariants(
  pageContext: PageContextWithI18nRoute,
  options: LocalizedPathOptions | undefined,
): boolean {
  const pv = pageContext.i18nRoute.routeConfig.paramVariants
  const qv = pageContext.i18nRoute.routeConfig.queryVariants
  return !hasAnyKey(pv) && !hasAnyKey(qv) && !options?.paramVariants && !options?.queryVariants
}

function buildLocalizedQueryString(
  query: Record<string, string>,
  queryVariants: QueryVariants,
  localeConfig: I18nRoute['localeConfig'],
  targetLocale: LocaleCode,
): string {
  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    searchParams.set(
      key,
      queryVariants.size === 0
        ? value
        : localizeNamedQueryValue(queryVariants, key, value, localeConfig, targetLocale),
    )
  }
  return searchParams.toString()
}

export function setRouteParamVariants(
  pageContext: PageContextWithI18nRoute,
  paramName: string,
  variants: RouteParamVariants,
): void {
  const paramVariants = new Map(getParamVariants(pageContext))
  const queryVariants = new Map(getQueryVariants(pageContext))
  paramVariants.set(paramName, { variants })
  const next = rebuildI18nRouteWithVariants(
    pageContext.urlOriginal,
    pageContext,
    pageContext.i18nRoute,
    paramVariants,
    queryVariants,
  )
  // Mutate in place so that the vike pageContext reference stays the same
  // and passToClient picks up the updated routeConfig.
  pageContext.i18nRoute.routeConfig = next.routeConfig
  pageContext.i18nRoute.localeConfig = next.localeConfig
}

export function setRouteQueryVariants(
  pageContext: PageContextWithI18nRoute,
  paramName: string,
  variants: RouteQueryVariants,
): void {
  const paramVariants = new Map(getParamVariants(pageContext))
  const queryVariants = new Map(getQueryVariants(pageContext))
  queryVariants.set(paramName, { variants })
  const next = rebuildI18nRouteWithVariants(
    pageContext.urlOriginal,
    pageContext,
    pageContext.i18nRoute,
    paramVariants,
    queryVariants,
  )
  pageContext.i18nRoute.routeConfig = next.routeConfig
  pageContext.i18nRoute.localeConfig = next.localeConfig
}

export function localizePath(
  pageContext: PageContextWithI18nRoute,
  routeKeyOrDescriptor: string | RouteDescriptor,
  localeOrOptions?: LocaleCode | LocalizedPathOptions,
  options?: LocalizedPathOptions,
): string {
  const stringRouteKey = typeof routeKeyOrDescriptor === 'string' ? routeKeyOrDescriptor : undefined
  const descriptor = typeof routeKeyOrDescriptor === 'string'
    ? undefined
    : routeKeyOrDescriptor
  const routeKey = stringRouteKey ?? descriptor!.key
  const resolvedLocale = typeof localeOrOptions === 'string' ? localeOrOptions : undefined
  const resolvedOptions = typeof localeOrOptions === 'object' ? localeOrOptions : options
  const targetLocale = resolvedLocale ?? pageContext.i18nRoute.localeConfig.currentLocale

  // Hot path: no options, no variants — use result cache
  if (!resolvedOptions && hasNoResolvedVariants(pageContext, undefined)) {
    if (descriptor) {
      const direct = localizeRouteDescriptorCached(
        descriptor,
        targetLocale,
        pageContext.i18nRoute.localeConfig,
      )
      if (direct) return direct
    }

    const effectiveRoutes = getEffectiveRouteIndex(pageContext)
    return localizeCanonicalPathCached(
      effectiveRoutes,
      routeKey,
      targetLocale,
      pageContext.i18nRoute.localeConfig,
    )
  }

  if (hasNoResolvedVariants(pageContext, resolvedOptions) && isParamsOnlyOptions(resolvedOptions)) {
    const fastDescriptor = descriptor ?? getDeclaredRouteDescriptor(pageContext, routeKey)
    if (fastDescriptor) {
      const direct = localizeRouteDescriptor(
        EMPTY_PARAM_VARIANTS_MAP,
        fastDescriptor,
        resolvedOptions?.params ?? {},
        targetLocale,
        pageContext.i18nRoute.localeConfig,
        resolvedOptions,
      )
      if (direct) return direct
    }
  }

  if (
    hasNoResolvedVariants(pageContext, resolvedOptions) &&
    resolvedOptions?.query &&
    !resolvedOptions.prefix
  ) {
    const fastDescriptor = descriptor ?? getDeclaredRouteDescriptor(pageContext, routeKey)
    const direct = localizeRouteDescriptor(
      EMPTY_PARAM_VARIANTS_MAP,
      fastDescriptor ?? { key: routeKey },
      resolvedOptions?.params ?? {},
      targetLocale,
      pageContext.i18nRoute.localeConfig,
      resolvedOptions,
    )
    const effectiveRoutes = getEffectiveRouteIndex(pageContext)
    const localizedPath = direct ?? localizeCanonicalPathCached(
      effectiveRoutes,
      resolvedOptions.params
        ? buildRoutePath(routeKey, resolvedOptions.params)
        : routeKey,
      targetLocale,
      pageContext.i18nRoute.localeConfig,
    )
    const search = buildLocalizedQueryString(
      resolvedOptions.query,
      EMPTY_QUERY_VARIANTS_MAP,
      pageContext.i18nRoute.localeConfig,
      targetLocale,
    )
    return search ? `${localizedPath}?${search}` : localizedPath
  }

  // Slow path: variants or options present
  const paramVariants = new Map(getParamVariants(pageContext))
  if (resolvedOptions?.paramVariants) {
    for (const [name, variants] of Object.entries(resolvedOptions.paramVariants)) {
      paramVariants.set(name, { variants })
    }
  }
  const queryVariants = new Map(getQueryVariants(pageContext))
  if (resolvedOptions?.queryVariants) {
    for (const [name, variants] of Object.entries(resolvedOptions.queryVariants)) {
      queryVariants.set(name, { variants })
    }
  }

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

  const effectiveRoutes = getEffectiveRouteIndex(pageContext)
  const directLocalizedPath = localizeRouteDescriptor(
    paramVariants,
    descriptor ?? { key: routeKey },
    interpolatedParams,
    targetLocale,
    pageContext.i18nRoute.localeConfig,
    resolvedOptions,
  ) ?? localizeRouteKey(
    effectiveRoutes,
    paramVariants,
    routeKey,
    interpolatedParams,
    targetLocale,
    pageContext.i18nRoute.localeConfig,
    resolvedOptions,
  )
  const localizedPath = directLocalizedPath ?? localizeCanonicalPath(
    effectiveRoutes,
    paramVariants,
    Object.keys(interpolatedParams).length > 0
      ? buildRoutePath(routeKey, interpolatedParams)
      : routeKey,
    queryVariants,
    targetLocale,
    pageContext.i18nRoute.localeConfig,
    resolvedOptions,
  )

  if (!resolvedOptions?.query) return localizedPath

  const search = buildLocalizedQueryString(
    resolvedOptions.query,
    queryVariants,
    pageContext.i18nRoute.localeConfig,
    targetLocale,
  )
  return search ? `${localizedPath}?${search}` : localizedPath
}

function localizeDescriptorPath(
  pageContext: PageContextWithI18nRoute,
  descriptor: RouteDescriptor,
  localeOrOptions?: LocaleCode | LocalizedPathOptions,
  options?: LocalizedPathOptions,
): string {
  const resolvedLocale = typeof localeOrOptions === 'string' ? localeOrOptions : undefined
  const resolvedOptions = typeof localeOrOptions === 'object' ? localeOrOptions : options
  const targetLocale = resolvedLocale ?? pageContext.i18nRoute.localeConfig.currentLocale
  const localeConfig = pageContext.i18nRoute.localeConfig

  const pv = pageContext.i18nRoute.routeConfig.paramVariants
  const qv = pageContext.i18nRoute.routeConfig.queryVariants
  if (!resolvedOptions && !hasAnyKey(pv) && !hasAnyKey(qv)) {
    const direct = localizeRouteDescriptorCached(
      descriptor,
      targetLocale,
      localeConfig,
    )
    if (direct) return direct

    const i18n = getI18nConfig(pageContext)
    const { routeIndex } = getCompiledDomainRouting(i18n, pageContext.i18nRoute.domainConfig.domain)
    return localizeCanonicalPathCached(
      routeIndex,
      descriptor.key,
      targetLocale,
      localeConfig,
    )
  }

  if (!hasAnyKey(pv) && !hasAnyKey(qv) && isParamsOnlyOptions(resolvedOptions)) {
    const direct = localizeRouteDescriptor(
      EMPTY_PARAM_VARIANTS_MAP,
      descriptor,
      resolvedOptions?.params ?? {},
      targetLocale,
      localeConfig,
      resolvedOptions,
    )
    if (direct) return direct
  }

  const paramVariants = new Map(getParamVariants(pageContext))
  if (resolvedOptions?.paramVariants) {
    for (const [name, variants] of Object.entries(resolvedOptions.paramVariants)) {
      paramVariants.set(name, { variants })
    }
  }
  const queryVariants = new Map(getQueryVariants(pageContext))
  if (resolvedOptions?.queryVariants) {
    for (const [name, variants] of Object.entries(resolvedOptions.queryVariants)) {
      queryVariants.set(name, { variants })
    }
  }

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

  const directLocalizedPath = localizeRouteDescriptor(
    paramVariants,
    descriptor,
    interpolatedParams,
    targetLocale,
    pageContext.i18nRoute.localeConfig,
    resolvedOptions,
  )

  const localizedPath = directLocalizedPath ?? (() => {
    const i18n = getI18nConfig(pageContext)
    const { routeIndex } = getCompiledDomainRouting(i18n, pageContext.i18nRoute.domainConfig.domain)
    return localizeCanonicalPath(
      routeIndex,
      paramVariants,
      Object.keys(interpolatedParams).length > 0
        ? buildRoutePath(descriptor.key, interpolatedParams)
        : descriptor.key,
      queryVariants,
      targetLocale,
      pageContext.i18nRoute.localeConfig,
      resolvedOptions,
    )
  })()

  if (!resolvedOptions?.query) return localizedPath

  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(resolvedOptions.query)) {
    searchParams.set(
      key,
      localizeNamedQueryValue(queryVariants, key, value, localeConfig, targetLocale),
    )
  }

  const search = searchParams.toString()
  return search ? `${localizedPath}?${search}` : localizedPath
}

export function useI18nRoute(
  pageContext: PageContextWithI18nRoute,
): UseI18nRouteResult {
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
    const restored = rebuildI18nRouteWithVariants(
      pageContext.urlOriginal,
      pageContext,
      pageContext.i18nRoute,
      paramVariants,
      queryVariants,
    )
    pageContext.i18nRoute.routeConfig = restored.routeConfig
    pageContext.i18nRoute.localeConfig = restored.localeConfig
  }

  return {
    get locale() { return pageContext.i18nRoute.localeConfig.currentLocale },
    get localeConfig() { return pageContext.i18nRoute.localeConfig },
    get domainConfig() { return pageContext.i18nRoute.domainConfig },
    get routeConfig() { return pageContext.i18nRoute.routeConfig },

    setRouteParamVariants(paramName, variants) {
      setRouteParamVariants(pageContext, paramName, variants)
    },

    setRouteQueryVariants(paramName, variants) {
      setRouteQueryVariants(pageContext, paramName, variants)
    },

    route(routeKey: string): BoundRouteDescriptor {
      return createBoundRouteDescriptor(pageContext, routeKey)
    },

    localizePath(routeKey: string | RouteDescriptor, localeOrOptions?: LocaleCode | LocalizedPathOptions, options?: LocalizedPathOptions): string {
      return localizePath(pageContext, routeKey, localeOrOptions, options)
    },
  }
}

export function createUseI18nRoute<TConfig extends I18nConfig>(
  _config: TConfig,
): (
  pageContext: PageContextWithI18nRoute,
) => TypedUseI18nRouteResult<TConfig> {
  return function useTypedI18nRoute(pageContext: PageContextWithI18nRoute): TypedUseI18nRouteResult<TConfig> {
    return useI18nRoute(pageContext) as unknown as TypedUseI18nRouteResult<TConfig>
  }
}
