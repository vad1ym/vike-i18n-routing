import { getI18nConfig } from './pageContext'
import { resolveDomainConfigForDomain } from './domain/normalize'
import { applyTrailingSlash } from './format'
import { createI18nRouter, createRouteDescriptor, getCompiledDomainRouting, localizeCanonicalPath, localizeCanonicalPathCached, localizeRouteDescriptor, localizeRouteDescriptorCached, localizeRouteKey, syncI18nRoute } from './router'
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
  TrailingSlash,
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

export type UseI18nRouteResult = I18nRoute & {
  i18nRoute: I18nRoute
  domain: I18nRoute['domainConfig']['domain']
  setRouteParamVariants: (paramName: string, variants: RouteParamVariants) => void
  setRouteQueryVariants: (paramName: string, variants: RouteQueryVariants) => void
  resolveRouteKey: (url: string) => string | null
  route: (routeKey: string) => BoundRouteDescriptor
  localizePath: {
    (routeKey: string | RouteDescriptor, locale?: LocaleCode, options?: LocalizedPathOptions): string
    (routeKey: string | RouteDescriptor, options?: LocalizedPathOptions): string
  }
  switchLocaleUrl: (locale: LocaleCode, options?: Omit<LocalizedPathOptions, 'prefix'>) => string
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
  switchLocaleUrl: (locale: LocaleCode, options?: Omit<LocalizedPathOptions, 'prefix'>) => string
}

function getParamVariants(pageContext: PageContextWithI18nRoute): ParamVariants {
  return getCachedParamVariants(pageContext.i18nRoute.paramVariants ?? EMPTY_PARAM_VARIANTS_RECORD)
}

function getQueryVariants(pageContext: PageContextWithI18nRoute): QueryVariants {
  return getCachedQueryVariants(pageContext.i18nRoute.queryVariants ?? EMPTY_QUERY_VARIANTS_RECORD)
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

function resolvedTrailingSlash(pageContext: PageContextWithI18nRoute): TrailingSlash {
  const i18n = getI18nConfig(pageContext)
  return resolveDomainConfigForDomain(i18n, pageContext.i18nRoute.domainConfig.domain).trailingSlash
}

function isParamsOnlyOptions(options: LocalizedPathOptions | undefined): boolean {
  if (!options) return false
  if (options.prefix !== undefined) return false
  if (options.absolute !== undefined) return false
  if (options.query) return false
  if (options.paramVariants) return false
  if (options.queryVariants) return false
  if (options.trailingSlash !== undefined) return false
  return true
}

function hasNoResolvedVariants(
  pageContext: PageContextWithI18nRoute,
  options: LocalizedPathOptions | undefined,
): boolean {
  const pv = pageContext.i18nRoute.paramVariants
  const qv = pageContext.i18nRoute.queryVariants
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
  const effectiveTrailingSlash = options?.trailingSlash ?? resolvedTrailingSlash(pageContext)
  const slashedPath = applyTrailingSlash(localizedPath, effectiveTrailingSlash)

  const forceAbsolute = options?.absolute
  const shouldReturnAbsolute = forceAbsolute ?? inputWasAbsolute

  if (!shouldReturnAbsolute) return slashedPath

  const baseUrl = getTargetBaseUrl(pageContext, targetLocale)
  if (baseUrl) {
    return new URL(slashedPath, baseUrl).toString()
  }

  if (inputOrigin) {
    return new URL(slashedPath, inputOrigin).toString()
  }

  if (forceAbsolute === true) {
    console.warn(
      '[vike-i18n] localizePath(..., { absolute: true }) requires i18n.baseUrl or domains[*].baseUrl. Returning a path-only URL.',
    )
  }

  return slashedPath
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
      ).logicalUrl,
      inputWasAbsolute: true,
      inputOrigin: absoluteUrl.origin,
    }
  }

  if (routeKeyOrDescriptor.includes('?')) {
    return {
      routeKeyOrDescriptor: createI18nRouter(routeKeyOrDescriptor, pageContext).logicalUrl,
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
  const next = createI18nRouter(
    pageContext.urlOriginal,
    pageContext,
    paramVariants,
    queryVariants,
  )
  // Mutate in place so that the vike pageContext reference stays the same
  // and passToClient picks up the updated route state.
  syncI18nRoute(pageContext.i18nRoute, next)
}

export function setRouteQueryVariants(
  pageContext: PageContextWithI18nRoute,
  paramName: string,
  variants: RouteQueryVariants,
): void {
  const paramVariants = new Map(getParamVariants(pageContext))
  const queryVariants = new Map(getQueryVariants(pageContext))
  queryVariants.set(paramName, { variants })
  const next = createI18nRouter(
    pageContext.urlOriginal,
    pageContext,
    paramVariants,
    queryVariants,
  )
  syncI18nRoute(pageContext.i18nRoute, next)
}

type LocalizationTargetContext = ReturnType<typeof getLocalizationTarget> & {
  targetLocale: LocaleCode
}

type PathLocalizationContext = {
  pageContext: PageContextWithI18nRoute
  routeKey: string
  descriptor?: RouteDescriptor
  targetDescriptor?: RouteDescriptor
  target: LocalizationTargetContext
  options?: LocalizedPathOptions
}

type VariantResolutionState = {
  paramVariants: ParamVariants
  queryVariants: QueryVariants
  interpolatedParams: Record<string, string | undefined>
}

function createLocalizationTargetContext(
  pageContext: PageContextWithI18nRoute,
  targetLocale: LocaleCode,
): LocalizationTargetContext {
  return {
    ...getLocalizationTarget(pageContext, targetLocale),
    targetLocale,
  }
}

function createPathLocalizationContext(
  pageContext: PageContextWithI18nRoute,
  routeKeyOrDescriptor: string | RouteDescriptor,
  localeOrOptions?: LocaleCode | LocalizedPathOptions,
  options?: LocalizedPathOptions,
): PathLocalizationContext {
  const descriptor = typeof routeKeyOrDescriptor === 'string'
    ? undefined
    : routeKeyOrDescriptor
  const routeKey = typeof routeKeyOrDescriptor === 'string'
    ? routeKeyOrDescriptor
    : routeKeyOrDescriptor.key
  const resolvedLocale = typeof localeOrOptions === 'string' ? localeOrOptions : undefined
  const resolvedOptions = typeof localeOrOptions === 'object' ? localeOrOptions : options
  const targetLocale = resolvedLocale ?? pageContext.i18nRoute.locale
  const target = createLocalizationTargetContext(pageContext, targetLocale)

  return {
    pageContext,
    routeKey,
    descriptor,
    targetDescriptor: descriptor
      ? getDescriptorForTargetRouteIndex(target.routeIndex, descriptor) ?? descriptor
      : undefined,
    target,
    options: resolvedOptions,
  }
}

function resolveVariantState(context: PathLocalizationContext): VariantResolutionState {
  const { pageContext, options } = context
  const paramVariants = new Map(getParamVariants(pageContext))
  if (options?.paramVariants) {
    for (const [name, variants] of Object.entries(options.paramVariants)) {
      paramVariants.set(name, { variants })
    }
  }
  const queryVariants = new Map(getQueryVariants(pageContext))
  if (options?.queryVariants) {
    for (const [name, variants] of Object.entries(options.queryVariants)) {
      queryVariants.set(name, { variants })
    }
  }

  const defaultLocale = pageContext.i18nRoute.localeConfig.defaultLocale
  const variantParams = options?.paramVariants
    ? Object.fromEntries(
        Object.entries(options.paramVariants).map(([name, variants]) => [
          name,
          variants[defaultLocale] ?? Object.values(variants)[0],
        ]),
      )
    : undefined

  return {
    paramVariants,
    queryVariants,
    interpolatedParams: { ...variantParams, ...options?.params },
  }
}

function tryCachedLocalizedPath(context: PathLocalizationContext): string | null {
  const { pageContext, routeKey, targetDescriptor, target, options } = context
  if (options || !hasNoResolvedVariants(pageContext, undefined) || resolvedTrailingSlash(pageContext) !== 'never') {
    return null
  }

  if (targetDescriptor) {
    const direct = localizeRouteDescriptorCached({
      descriptor: targetDescriptor,
      locale: target.targetLocale,
      localeConfig: target.localeConfig,
    })
    if (direct) return direct
  }

  return localizeCanonicalPathCached({
    index: target.routeIndex,
    canonicalPath: routeKey,
    locale: target.targetLocale,
    localeConfig: target.localeConfig,
  })
}

function trySimpleLocalizedPath(context: PathLocalizationContext): string | null {
  const { pageContext, routeKey, targetDescriptor, target, options } = context

  if (!hasNoResolvedVariants(pageContext, options) || !isParamsOnlyOptions(options)) {
    return null
  }

  const fastDescriptor = targetDescriptor ?? getDescriptorForTargetRouteIndex(target.routeIndex, routeKey)
  if (!fastDescriptor) return null

  return localizeRouteDescriptor({
    paramVariants: EMPTY_PARAM_VARIANTS_MAP,
    descriptor: fastDescriptor,
    params: options?.params ?? {},
    locale: target.targetLocale,
    localeConfig: target.localeConfig,
    options,
  })
}

function tryQueryOnlyLocalizedPath(context: PathLocalizationContext): string | null {
  const { pageContext, routeKey, targetDescriptor, target, options } = context
  if (!hasNoResolvedVariants(pageContext, options) || !options?.query || options.prefix) {
    return null
  }

  const direct = localizeRouteDescriptor({
    paramVariants: EMPTY_PARAM_VARIANTS_MAP,
    descriptor: targetDescriptor ?? getDescriptorForTargetRouteIndex(target.routeIndex, routeKey) ?? { key: routeKey },
    params: options.params ?? {},
    locale: target.targetLocale,
    localeConfig: target.localeConfig,
    options,
  })
  const localizedPath = direct ?? localizeCanonicalPathCached({
    index: target.routeIndex,
    canonicalPath: options.params ? buildRoutePath(routeKey, options.params) : routeKey,
    locale: target.targetLocale,
    localeConfig: target.localeConfig,
  })
  const search = buildLocalizedQueryString(
    options.query,
    EMPTY_QUERY_VARIANTS_MAP,
    target.localeConfig,
    target.targetLocale,
  )
  return search ? `${localizedPath}?${search}` : localizedPath
}

function resolveLocalizedPath(context: PathLocalizationContext): string {
  const { routeKey, targetDescriptor, target, options } = context
  const state = resolveVariantState(context)
  const descriptor = targetDescriptor ?? { key: routeKey }

  const directLocalizedPath = localizeRouteDescriptor({
    paramVariants: state.paramVariants,
    descriptor,
    params: state.interpolatedParams,
    locale: target.targetLocale,
    localeConfig: target.localeConfig,
    options,
  }) ?? localizeRouteKey({
    index: target.routeIndex,
    paramVariants: state.paramVariants,
    routeKey,
    params: state.interpolatedParams,
    locale: target.targetLocale,
    localeConfig: target.localeConfig,
    options,
  })

  const localizedPath = directLocalizedPath ?? localizeCanonicalPath({
    index: target.routeIndex,
    paramVariants: state.paramVariants,
    canonicalPath: Object.keys(state.interpolatedParams).length > 0
      ? buildRoutePath(routeKey, state.interpolatedParams)
      : routeKey,
    queryVariants: state.queryVariants,
    locale: target.targetLocale,
    localeConfig: target.localeConfig,
    options,
  })

  if (!options?.query) return localizedPath

  const search = buildLocalizedQueryString(
    options.query,
    state.queryVariants,
    target.localeConfig,
    target.targetLocale,
  )
  return search ? `${localizedPath}?${search}` : localizedPath
}

function localizePathOnly(
  pageContext: PageContextWithI18nRoute,
  routeKeyOrDescriptor: string | RouteDescriptor,
  localeOrOptions?: LocaleCode | LocalizedPathOptions,
  options?: LocalizedPathOptions,
): string {
  const context = createPathLocalizationContext(pageContext, routeKeyOrDescriptor, localeOrOptions, options)
  return tryCachedLocalizedPath(context)
    ?? trySimpleLocalizedPath(context)
    ?? tryQueryOnlyLocalizedPath(context)
    ?? resolveLocalizedPath(context)
}

export function localizePath(
  pageContext: PageContextWithI18nRoute,
  routeKeyOrDescriptor: string | RouteDescriptor,
  localeOrOptions?: LocaleCode | LocalizedPathOptions,
  options?: LocalizedPathOptions,
): string {
  const resolvedLocale = typeof localeOrOptions === 'string' ? localeOrOptions : undefined
  const resolvedOptions = typeof localeOrOptions === 'object' ? localeOrOptions : options
  const targetLocale = resolvedLocale ?? pageContext.i18nRoute.locale
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

export function switchLocaleUrl(
  pageContext: PageContextWithI18nRoute,
  locale: LocaleCode,
  options?: Omit<LocalizedPathOptions, 'prefix'>,
): string {
  return localizePath(pageContext, pageContext.i18nRoute.logicalUrl, locale, {
    ...options,
    prefix: true,
  })
}

export function resolveRouteKey(
  pageContext: PageContextWithI18nRoute,
  url: string,
): string | null {
  return createI18nRouter(url, pageContext).routeKey ?? null
}

function localizeDescriptorPath(
  pageContext: PageContextWithI18nRoute,
  descriptor: RouteDescriptor,
  localeOrOptions?: LocaleCode | LocalizedPathOptions,
  options?: LocalizedPathOptions,
): string {
  const context = createPathLocalizationContext(pageContext, descriptor, localeOrOptions, options)
  const localizedPath = tryCachedLocalizedPath(context)
    ?? trySimpleLocalizedPath(context)
    ?? resolveLocalizedPath(context)

  return finalizeLocalizedUrl(
    pageContext,
    localizedPath,
    context.target.targetLocale,
    context.options,
    false,
  )
}

export function useI18nRoute(
  // Accepts any object to avoid TypeScript excessive stack depth errors when
  // callers pass vike's PageContext (which has deeply recursive generic types).
  _pageContext: object,
): UseI18nRouteResult {
  const pageContext = _pageContext as PageContextWithI18nRoute
  // On client hydration, i18nRoute is created fresh by onBeforeRoute without runtime variants.
  // passToClient transfers them separately and they are restored here.
  if (
    (
      (pageContext.i18nParamVariants && Object.keys(pageContext.i18nParamVariants).length > 0) ||
      (pageContext.i18nQueryVariants && Object.keys(pageContext.i18nQueryVariants).length > 0)
    ) &&
    Object.keys(pageContext.i18nRoute.paramVariants ?? {}).length === 0 &&
    Object.keys(pageContext.i18nRoute.queryVariants ?? {}).length === 0
  ) {
    const paramVariants = new Map(Object.entries(pageContext.i18nParamVariants ?? {}))
    const queryVariants = new Map(Object.entries(pageContext.i18nQueryVariants ?? {}))
    const restored = createI18nRouter(
      pageContext.urlOriginal,
      pageContext,
      paramVariants,
      queryVariants,
    )
    syncI18nRoute(pageContext.i18nRoute, restored)
  }

  return {
    get i18nRoute() { return pageContext.i18nRoute },
    get domain() { return pageContext.i18nRoute.domainConfig.domain },
    get locales() { return pageContext.i18nRoute.locales },
    get locale() { return pageContext.i18nRoute.locale },
    get params() { return pageContext.i18nRoute.params },
    get logicalUrl() { return pageContext.i18nRoute.logicalUrl },
    get routeKey() { return pageContext.i18nRoute.routeKey },
    get requestUrl() { return pageContext.i18nRoute.requestUrl },
    get defaultLocaleUrl() { return pageContext.i18nRoute.defaultLocaleUrl },
    get currentLocaleUrl() { return pageContext.i18nRoute.currentLocaleUrl },
    get alternateUrls() { return pageContext.i18nRoute.alternateUrls },
    get redirectTo() { return pageContext.i18nRoute.redirectTo },
    get redirectStatus() { return pageContext.i18nRoute.redirectStatus },
    get renderTo() { return pageContext.i18nRoute.renderTo },
    get aliasFrom() { return pageContext.i18nRoute.aliasFrom },
    get paramVariants() { return pageContext.i18nRoute.paramVariants },
    get queryVariants() { return pageContext.i18nRoute.queryVariants },
    get localeMeta() { return pageContext.i18nRoute.localeMeta },
    get localesConfig() { return pageContext.i18nRoute.localesConfig },
    get localeConfig() { return pageContext.i18nRoute.localeConfig },
    get domainConfig() { return pageContext.i18nRoute.domainConfig },

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

    switchLocaleUrl(locale: LocaleCode, options?: Omit<LocalizedPathOptions, 'prefix'>): string {
      return switchLocaleUrl(pageContext, locale, options)
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
