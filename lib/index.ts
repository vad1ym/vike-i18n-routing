/// <reference path="./vike/global.d.ts" />

export type {
  DetectorContext,
  DomainConfig,
  I18nConfig,
  I18nRouter,
  I18nRoutes,
  LocaleCode,
  LocaleConfig,
  LocaleCookieAction,
  RouteSlugVariants,
} from './core/types'

export { resolveI18nRoute, resolveCanonical, setRouteSlugVariants } from './core/resolve'
export { createI18nRouter } from './core/router'
export {
  getAlternates,
  toCanonicalUrl,
  toLocalizedUrl,
  toRouteUrl,
} from './core/utils'
