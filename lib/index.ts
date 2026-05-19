/// <reference path="./vike/global.d.ts" />

export type {
  AlternateUrl,
  I18nConfig,
  I18nRoute,
  LocaleCode,
  LocaleConfig,
  LocaleMeta,
  DomainMeta,
  PageContextDomainConfig,
  PageContextLocaleConfig,
  RedirectStatusCode,
  RouteDescriptor,
  RouteConfig,
  RouteParamVariants,
  RouteQueryVariants,
} from './core/types'

export { generateStaticPaths } from './core/generateStaticPaths'
export { useI18nRoute } from './core/useI18nRoute'
export type { UseI18nRouteResult } from './core/useI18nRoute'
