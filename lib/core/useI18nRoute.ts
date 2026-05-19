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
  resolveRouteKey: (url: string) => string | null
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
  resolveRouteKey: (url: string) => RouteKey<TConfig> | null
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

function createLocaleConfigForTarget(
  pageContext: PageContextWithI18nRoute,
  targetLocale: LocaleCode,
  domain: string | undefined,
) {
  const i18n = getI18nConfig(pageContext)
  const compiled = getCompiledDomainRouting(i18n, domain)

  return {
    domain,
    baseUrl: compiled.resolved.baseUrl,
    routeIndex: compiled.routeIndex,
    localeConfig: {
      defaultLocale: compiled.resolved.defaultLocale,
      locales: compiled.resolved.locales,
      currentLocale: targetLocale,
      currentLocaleMeta: compiled.resolved.locales[targetLocale]?.meta,
      prefixDefaultLocale: compiled.resolved.prefixDefaultLocale,
    } satisfies I18nRoute['localeConfig'],
  }
}

function getLocalizationTarget(
  pageContext: PageContextWithI18nRoute,
  targetLocale: LocaleCode,
) {
  const i18n = getI18nConfig(pageContext)
  const currentDomain = pageContext.i18nRoute.domainConfig.domain
  const currentTarget = createLocaleConfigForTarget(pageContext, targetLocale, currentDomain)

  if (currentTarget.localeConfig.locales[targetLocale]) {
    return currentTarget
  }

  for (const domain of Object.keys(i18n.domains ?? {})) {
    if (domain === currentDomain || domain.startsWith('*.')) continue

    const target = createLocaleConfigForTarget(pageContext, targetLocale, domain)
    if (target.localeConfig.locales[targetLocale]) {
      return target
    }
  }

  const rootTarget = createLocaleConfigForTarget(pageContext, targetLocale, undefined)
  if (rootTarget.localeConfig.locales[targetLocale]) {
    return rootTarget
  }

  return currentTarget
}

function getDescriptorForTargetRouteIndex(
  routeIndex: ReturnType<typeof getEffectiveRouteIndex>,
  descriptorOrKey: RouteDescriptor | string,
): RouteDescriptor | undefined {
  const routeKey = typeof descriptorOrKey === 'string' ? descriptorOrKey : descriptorOrKey.key
  if (!routeIndex.routes[routeKey]) return undefined
  return createRouteDescriptor(routeIndex, routeKey)
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
  if (options.absolute !== undefined) return false
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

function getTargetBaseUrl(
  pageContext: PageContextWithI18nRoute,
  targetLocale: LocaleCode,
): string | undefined {
  return getLocalizationTarget(pageContext, targetLocale).baseUrl
}

function finalizeLocalizedUrl(
  pageContext: PageContextWithI18nRoute,
  localizedPath: string,
  targetLocale: LocaleCode,
  options: LocalizedPathOptions | undefined,
  inputWasAbsolute: boolean,
  inputOrigin?: string,
): string {
  const forceAbsolute = options?.absolute
  const shouldReturnAbsolute = forceAbsolute ?? inputWasAbsolute

  if (!shouldReturnAbsolute) return localizedPath

  const baseUrl = getTargetBaseUrl(pageContext, targetLocale)
  if (baseUrl) {
    return new URL(localizedPath, baseUrl).toString()
  }

  if (inputOrigin) {
    return new URL(localizedPath, inputOrigin).toString()
  }

  if (forceAbsolute === true) {
    console.warn(
      '[vike-i18n] localizePath(..., { absolute: true }) requires i18n.baseUrl or domains[*].baseUrl. Returning a path-only URL.',
    )
  }

  return localizedPath
}

function parseAbsoluteUrl(url: string): URL | null {
  try {
    return new URL(url)
  } catch {
    return null
  }
}

function parseLocalizePathInput(
  pageContext: PageContextWithI18nRoute,
  routeKeyOrDescriptor: string | RouteDescriptor,
): {
  routeKeyOrDescriptor: string | RouteDescriptor
  inputWasAbsolute: boolean
  inputOrigin?: string
} {
  if (typeof routeKeyOrDescriptor !== 'string') {
    return {
      routeKeyOrDescriptor,
      inputWasAbsolute: false,
    }
  }

  const absoluteUrl = parseAbsoluteUrl(routeKeyOrDescriptor)
  if (absoluteUrl) {
    return {
      routeKeyOrDescriptor: createI18nRouter(
        `${absoluteUrl.pathname}${absoluteUrl.search}`,
        pageContext,
      ).routeConfig.canonicalUrl,
      inputWasAbsolute: true,
      inputOrigin: absoluteUrl.origin,
    }
  }

  if (routeKeyOrDescriptor.includes('?')) {
    return {
      routeKeyOrDescriptor: createI18nRouter(routeKeyOrDescriptor, pageContext).routeConfig.canonicalUrl,
      inputWasAbsolute: false,
    }
  }

  return {
    routeKeyOrDescriptor,
    inputWasAbsolute: false,
  }
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

function localizePathOnly(
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
  const localizationTarget = getLocalizationTarget(pageContext, targetLocale)
  const targetLocaleConfig = localizationTarget.localeConfig
  const targetRouteIndex = localizationTarget.routeIndex
  const targetDescriptor = descriptor
    ? getDescriptorForTargetRouteIndex(targetRouteIndex, descriptor) ?? descriptor
    : undefined

  // Hot path: no options, no variants — use result cache
  if (!resolvedOptions && hasNoResolvedVariants(pageContext, undefined)) {
    if (targetDescriptor) {
      const direct = localizeRouteDescriptorCached(
        targetDescriptor,
        targetLocale,
        targetLocaleConfig,
      )
      if (direct) return direct
    }

    return localizeCanonicalPathCached(
      targetRouteIndex,
      routeKey,
      targetLocale,
      targetLocaleConfig,
    )
  }

  if (hasNoResolvedVariants(pageContext, resolvedOptions) && isParamsOnlyOptions(resolvedOptions)) {
    const fastDescriptor = targetDescriptor ?? getDescriptorForTargetRouteIndex(targetRouteIndex, routeKey)
    if (fastDescriptor) {
      const direct = localizeRouteDescriptor(
        EMPTY_PARAM_VARIANTS_MAP,
        fastDescriptor,
        resolvedOptions?.params ?? {},
        targetLocale,
        targetLocaleConfig,
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
    const fastDescriptor = targetDescriptor ?? getDescriptorForTargetRouteIndex(targetRouteIndex, routeKey)
    const direct = localizeRouteDescriptor(
      EMPTY_PARAM_VARIANTS_MAP,
      fastDescriptor ?? { key: routeKey },
      resolvedOptions?.params ?? {},
      targetLocale,
      targetLocaleConfig,
      resolvedOptions,
    )
    const localizedPath = direct ?? localizeCanonicalPathCached(
      targetRouteIndex,
      resolvedOptions.params
        ? buildRoutePath(routeKey, resolvedOptions.params)
        : routeKey,
      targetLocale,
      targetLocaleConfig,
    )
    const search = buildLocalizedQueryString(
      resolvedOptions.query,
      EMPTY_QUERY_VARIANTS_MAP,
      targetLocaleConfig,
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
    targetDescriptor ?? { key: routeKey },
    interpolatedParams,
    targetLocale,
    targetLocaleConfig,
    resolvedOptions,
  ) ?? localizeRouteKey(
    targetRouteIndex,
    paramVariants,
    routeKey,
    interpolatedParams,
    targetLocale,
    targetLocaleConfig,
    resolvedOptions,
  )
  const localizedPath = directLocalizedPath ?? localizeCanonicalPath(
    targetRouteIndex,
    paramVariants,
    Object.keys(interpolatedParams).length > 0
      ? buildRoutePath(routeKey, interpolatedParams)
      : routeKey,
    queryVariants,
    targetLocale,
    targetLocaleConfig,
    resolvedOptions,
  )

  if (!resolvedOptions?.query) return localizedPath

  const search = buildLocalizedQueryString(
    resolvedOptions.query,
    queryVariants,
    targetLocaleConfig,
    targetLocale,
  )
  return search ? `${localizedPath}?${search}` : localizedPath
}

export function localizePath(
  pageContext: PageContextWithI18nRoute,
  routeKeyOrDescriptor: string | RouteDescriptor,
  localeOrOptions?: LocaleCode | LocalizedPathOptions,
  options?: LocalizedPathOptions,
): string {
  const resolvedLocale = typeof localeOrOptions === 'string' ? localeOrOptions : undefined
  const resolvedOptions = typeof localeOrOptions === 'object' ? localeOrOptions : options
  const targetLocale = resolvedLocale ?? pageContext.i18nRoute.localeConfig.currentLocale
  const parsed = parseLocalizePathInput(pageContext, routeKeyOrDescriptor)
  const localizedPath = localizePathOnly(
    pageContext,
    parsed.routeKeyOrDescriptor,
    localeOrOptions,
    options,
  )

  return finalizeLocalizedUrl(
    pageContext,
    localizedPath,
    targetLocale,
    resolvedOptions,
    parsed.inputWasAbsolute,
    parsed.inputOrigin,
  )
}

export function resolveRouteKey(
  pageContext: PageContextWithI18nRoute,
  url: string,
): string | null {
  return createI18nRouter(url, pageContext).routeConfig.i18nUrl ?? null
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
  const localizationTarget = getLocalizationTarget(pageContext, targetLocale)
  const localeConfig = localizationTarget.localeConfig
  const targetDescriptor = getDescriptorForTargetRouteIndex(localizationTarget.routeIndex, descriptor) ?? descriptor

  const pv = pageContext.i18nRoute.routeConfig.paramVariants
  const qv = pageContext.i18nRoute.routeConfig.queryVariants
  if (!resolvedOptions && !hasAnyKey(pv) && !hasAnyKey(qv)) {
    const direct = localizeRouteDescriptorCached(
      targetDescriptor,
      targetLocale,
      localeConfig,
    )
    if (direct) {
      return finalizeLocalizedUrl(
        pageContext,
        direct,
        targetLocale,
        resolvedOptions,
        false,
      )
    }

    return finalizeLocalizedUrl(
      pageContext,
      localizeCanonicalPathCached(
        localizationTarget.routeIndex,
        targetDescriptor.key,
        targetLocale,
        localeConfig,
      ),
      targetLocale,
      resolvedOptions,
      false,
    )
  }

  if (!hasAnyKey(pv) && !hasAnyKey(qv) && isParamsOnlyOptions(resolvedOptions)) {
    const direct = localizeRouteDescriptor(
      EMPTY_PARAM_VARIANTS_MAP,
      targetDescriptor,
      resolvedOptions?.params ?? {},
      targetLocale,
      localeConfig,
      resolvedOptions,
    )
    if (direct) {
      return finalizeLocalizedUrl(
        pageContext,
        direct,
        targetLocale,
        resolvedOptions,
        false,
      )
    }
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
    targetDescriptor,
    interpolatedParams,
    targetLocale,
    localeConfig,
    resolvedOptions,
  )

  const localizedPath = directLocalizedPath ?? (() => {
    return localizeCanonicalPath(
      localizationTarget.routeIndex,
      paramVariants,
      Object.keys(interpolatedParams).length > 0
        ? buildRoutePath(targetDescriptor.key, interpolatedParams)
        : targetDescriptor.key,
      queryVariants,
      targetLocale,
      localeConfig,
      resolvedOptions,
    )
  })()

  if (!resolvedOptions?.query) {
    return finalizeLocalizedUrl(
      pageContext,
      localizedPath,
      targetLocale,
      resolvedOptions,
      false,
    )
  }

  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(resolvedOptions.query)) {
    searchParams.set(
      key,
      localizeNamedQueryValue(queryVariants, key, value, localeConfig, targetLocale),
    )
  }

  const search = searchParams.toString()
  return finalizeLocalizedUrl(
    pageContext,
    search ? `${localizedPath}?${search}` : localizedPath,
    targetLocale,
    resolvedOptions,
    false,
  )
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

    resolveRouteKey(url: string): string | null {
      return resolveRouteKey(pageContext, url)
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
