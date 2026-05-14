export type LocaleCode = string

export type LocaleConfig = {
  urlPrefix: string
}

export type LocaleConfigs = Record<LocaleCode, LocaleConfig> | LocaleCode[]

export type I18nRoutes = Record<string, Record<LocaleCode, string>>

export type DomainMeta = Record<string, any>

export type DomainConfig = {
  defaultLocale?: LocaleCode
  locales?: LocaleConfigs
  prefixDefaultLocale?: boolean
  meta?: DomainMeta
}

export type I18nPageContext = {
  urlOriginal: string
  config: {
    i18n?: I18nConfig
  }
  headers?: Record<string, string | string[] | undefined>
  session?: Record<string, string | undefined>
  domain?: string
}

export type LocaleCookieAction = {
  name: string
  value: string
}

export type RequestConfig = {
  locale: LocaleCode
  domain?: string
  cookieLocale?: string
}

export type ResolvedDomainConfig = {
  domain?: string
  defaultLocale: LocaleCode
  locales: Record<LocaleCode, LocaleConfig>
  prefixDefaultLocale: boolean
  meta?: DomainMeta
}

export type PageContextLocaleConfig = {
  defaultLocale: LocaleCode
  locales: Record<LocaleCode, LocaleConfig>
  currentLocale: LocaleCode
  prefixDefaultLocale: boolean
}

export type PageContextDomainConfig = {
  domain?: string
  defaultLocale?: LocaleCode
  locales?: Record<LocaleCode, LocaleConfig>
  prefixDefaultLocale?: boolean
  meta?: DomainMeta
}

export type AlternateUrl = {
  locale: LocaleCode
  url: string
}

export type RouteConfig = {
  requestUrl: string
  defaultLocaleUrl: string
  currentLocaleUrl: string
  redirectTo?: string
  vikeUrl: string
  i18nUrl: string
  vikeUrlParams: Record<string, string>
  i18nUrlParams: Record<string, string>
  alternateUrls: AlternateUrl[]
}

export type I18nConfig = {
  defaultLocale: LocaleCode
  locales: LocaleConfigs
  routes: I18nRoutes
  prefixDefaultLocale?: boolean
  domains?: Record<string, DomainConfig>
  domainDetector?: (pageContext: I18nPageContext) => string | null | undefined
  localeDetector?: (pageContext: I18nPageContext) => string | null | undefined
  localeCookie?: string | false
}

export type RouteParamVariants = Record<LocaleCode, string>

export type LocalizedPathOptions = {
  prefixDefaultLocale?: boolean
  noPrefixLocale?: boolean
  prefixLocale?: boolean
}

export type SetRouteParamVariantsOptions = {
  redirect?: boolean
}

export type I18nRoute = {
  requestConfig: RequestConfig
  localeConfig: PageContextLocaleConfig
  domainConfig: PageContextDomainConfig
  routeConfig: RouteConfig
  setRouteParamVariants: (
    paramName: string,
    variants: RouteParamVariants,
    options?: SetRouteParamVariantsOptions,
  ) => void
  localizePath: (
    routeKey: string,
    locale?: LocaleCode,
    options?: LocalizedPathOptions,
  ) => string
}
