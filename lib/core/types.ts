import type { PageContext } from "vike/types"

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
  canonicalUrl: string
  i18nUrl: string
  i18nUrlParams: Record<string, string>
  alternateUrls: AlternateUrl[]
  paramVariants: Record<string, ParamVariantConfig>
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

export type ParamVariantConfig = {
  variants: RouteParamVariants
}

export type LocalizedPathOptions = {
  prefix?: boolean
}


export type I18nRoute = {
  localeConfig: PageContextLocaleConfig
  domainConfig: PageContextDomainConfig
  routeConfig: RouteConfig
}
