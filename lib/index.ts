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
  RouteKey,
  RouteConfig,
  RouteParamVariants,
  RouteQueryVariants,
} from './core/types'

export { generateStaticPaths } from './core/generateStaticPaths'
export { createUseI18nRoute, useI18nRoute } from './core/useI18nRoute'
export type { TypedUseI18nRouteResult, UseI18nRouteResult } from './core/useI18nRoute'
