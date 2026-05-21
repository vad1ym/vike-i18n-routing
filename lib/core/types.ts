import type { PageContext } from "vike/types"

export type LocaleCode = string

export type LocaleMeta = Record<string, any>

export type LocaleConfig = {
  urlPrefix: string
  meta?: LocaleMeta
}

export type LocaleConfigs = Record<LocaleCode, LocaleConfig> | LocaleCode[]

export type I18nRouteLeaf = Record<LocaleCode, string>

export interface I18nRouteTree {
  [route: string]: I18nRouteLeaf | I18nRouteTree
}

export type I18nRoutes = I18nRouteTree

export type FlatI18nRoutes = Record<string, I18nRouteLeaf>

export type TrailingSlash = 'never' | 'always' | 'preserve'

export type DomainMeta = Record<string, any>

export type DomainConfig = {
  baseUrl?: string
  defaultLocale?: LocaleCode
  locales?: LocaleConfigs
  prefixDefaultLocale?: boolean
  meta?: DomainMeta
  routes?: I18nRoutes
  redirects?: RedirectConfig
  aliases?: AliasConfig
  trailingSlash?: TrailingSlash
}

export type I18nPageContext = Partial<PageContext> & {
  urlOriginal: string
  config: {
    i18n?: I18nConfig
  }
  session?: Record<string, string | undefined>
  domain?: string
}

export type LocaleCookieAction = {
  name: string
  value: string
}

export type LocaleDetectorConfig = {
  acceptLanguageHeader?: boolean
  localeCookie?: boolean
  queryParams?: boolean
  session?: boolean
}

export type ResolvedDomainConfig = {
  domain?: string
  baseUrl?: string
  defaultLocale: LocaleCode
  locales: Record<LocaleCode, LocaleConfig>
  prefixDefaultLocale: boolean
  meta?: DomainMeta
  routes?: I18nRoutes
  redirects?: RedirectConfig
  aliases?: AliasConfig
  trailingSlash: TrailingSlash
  trailingSlashRedirect: number | false
}

export type PageContextLocaleConfig = {
  defaultLocale: LocaleCode
  locales: Record<LocaleCode, LocaleConfig>
  currentLocale: LocaleCode
  currentLocaleMeta?: LocaleMeta
  prefixDefaultLocale: boolean
}

export type PageContextDomainConfig = {
  domain?: string
  baseUrl?: string
  defaultLocale?: LocaleCode
  locales?: Record<LocaleCode, LocaleConfig>
  prefixDefaultLocale?: boolean
  meta?: DomainMeta
}

export type AlternateUrl = {
  locale: LocaleCode
  url: string
}

export type PageContextLocaleEntry = LocaleConfig & {
  locale: LocaleCode
}

export type RedirectStatusCode = 301 | 302 | 307 | 308

export type RedirectTarget =
  | string
  | { url: string; locales?: LocaleCode[]; status?: RedirectStatusCode }

export type RedirectConfig = Record<string, RedirectTarget>

// Simple string alias: '/company': '/about'
// Localized alias: '/spain/about': { target: '/about', en: '/spain/about', ru: '/spain/o-nas' }
export type LocalizedAliasValue = { target: string } & Record<LocaleCode, string>

export type AliasValue = string | LocalizedAliasValue

export type AliasConfig = Record<string, AliasValue>

export type I18nConfig = {
  baseUrl?: string
  defaultLocale: LocaleCode
  locales: LocaleConfigs
  routes: I18nRoutes
  debug?: boolean
  redirects?: RedirectConfig
  aliases?: AliasConfig
  prefixDefaultLocale?: boolean
  domains?: Record<string, DomainConfig>
  domainDetector?: (pageContext: I18nPageContext) => string | null | undefined
  localeDetector?: ((pageContext: I18nPageContext) => string | null | undefined) | LocaleDetectorConfig
  localeCookie?: string | false
  trailingSlash?: TrailingSlash
  trailingSlashRedirect?: number | false
}

export type RouteParamVariants = Record<LocaleCode, string>
export type RouteQueryVariants = Record<LocaleCode, string>

export type ParamVariantConfig = {
  variants: RouteParamVariants
}

export type QueryVariantConfig = {
  variants: RouteQueryVariants
}

export type LocalizedPathOptions = {
  prefix?: boolean
  absolute?: boolean
  params?: Record<string, string>
  query?: Record<string, string>
  paramVariants?: Record<string, RouteParamVariants>
  queryVariants?: Record<string, RouteQueryVariants>
  trailingSlash?: TrailingSlash
}

export type StaticRouteParams = Record<string, string | undefined>

export type GenerateStaticPathsOptions = {
  routeParams?: Record<string, StaticRouteParams[]>
}

type JoinRouteKey<Parent extends string, Child extends string> = Parent extends '/'
  ? Child
  : Child extends '/'
    ? Parent
    : `${Parent}${Child}`

type RouteKeysFromRoutes<TRoutes extends I18nRoutes> = {
  [TKey in Extract<keyof TRoutes, string>]:
    TRoutes[TKey] extends I18nRouteLeaf
      ? TKey
      : TRoutes[TKey] extends I18nRouteTree
        ? JoinRouteKey<TKey, RouteKeysFromRoutes<TRoutes[TKey]>>
        : never
}[Extract<keyof TRoutes, string>]

export type RouteKey<TConfig extends Pick<I18nConfig, 'routes'>> =
  RouteKeysFromRoutes<TConfig['routes']> & string

export type RouteDescriptor = {
  key: string
}

export type I18nRoute = {
  locale: LocaleCode
  locales: LocaleCode[]
  params: Record<string, string>
  logicalUrl: string
  routeKey?: string
  requestUrl: string
  defaultLocaleUrl: string
  currentLocaleUrl: string
  alternateUrls: AlternateUrl[]
  redirectTo?: string
  redirectStatus?: RedirectStatusCode
  renderTo?: string
  aliasFrom?: string
  paramVariants: Record<string, ParamVariantConfig>
  queryVariants: Record<string, QueryVariantConfig>
  localeMeta?: LocaleMeta
  localesConfig: PageContextLocaleEntry[]
  localeConfig: PageContextLocaleConfig
  domainConfig: PageContextDomainConfig
}
