/// <reference path="./vike/global.d.ts" />

export type {
  AlternateUrl,
  DomainConfig,
  I18nRoute,
  I18nConfig,
  I18nPageContext,
  I18nRouter,
  I18nRoutes,
  LocaleCode,
  LocaleConfig,
  LocaleCookieAction,
  PageContextDomainConfig,
  PageContextLocaleConfig,
  RequestConfig,
  RouteConfig,
  RouteParamVariants,
} from './core/types'

export { createI18nRouter } from './core/router'
export {
  createPageContext,
  getCookies,
  getDomain,
  getHeaders,
  getParsedUrl,
  getPathname,
  getRequestUrl,
  getSearchParams,
  getSession,
} from './core/pageContext'
export {
  getAlternates,
  toLocalizedUrl,
} from './core/utils'
