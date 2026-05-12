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

export type DetectorContext = {
  url: string
  pathname: string
  headers: Record<string, string | string[] | undefined>
  cookies: Record<string, string>
  session?: Record<string, string | undefined>
  domain?: string
  searchParams: URLSearchParams
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

export type I18nConfig = {
  defaultLocale: LocaleCode
  locales: LocaleConfigs
  routes: I18nRoutes
  prefixDefaultLocale?: boolean
  domains?: Record<string, DomainConfig>
  domainDetector?: (context: DetectorContext) => string | null | undefined
  localeDetector?: (context: DetectorContext) => string | null | undefined
  localeCookie?: string | false
}

export type RouteSlugVariants = Record<LocaleCode, string>

export type LocalizedPathOptions = {
  prefixDefaultLocale?: boolean
  noPrefixLocale?: boolean
  prefixLocale?: boolean
}

export type ResolveRouteOptions = {
  context: DetectorContext
  detectedLocale?: string
}

export type ResolvedRouteResult = {
  locale: LocaleCode
  canonical: string
  redirectTo?: string
  deferredRedirectTo?: string
  domain?: string
  domainMeta?: Record<string, any>
}

export type I18nRouter = {
  resolve(pathname: string, options: ResolveRouteOptions): ResolvedRouteResult
  resolveCanonical(pathname: string, context: DetectorContext): string
  resolveLocalizedPath(
    routeKey: string,
    locale: LocaleCode,
    context: DetectorContext,
    options?: LocalizedPathOptions,
  ): string
  getAlternates(
    url: string,
    context: DetectorContext,
  ): { locale: LocaleCode; url: string }[]
}
