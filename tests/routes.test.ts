import { describe, it, expect } from 'vitest'
import { onBeforeRoute } from '../lib/vike/onBeforeRoute'
import { createI18nRouter } from '../lib/core/router'
import { createPageContext } from '../lib/core/pageContext'
import { useI18nRoute } from '../lib/core/useI18nRoute'
import { makePageContext, resolveRenderRedirect } from './helpers/pageContext'
import { baseConfig } from './helpers/config'

describe('routes — translated paths', () => {
  it('resolves ru translated path to logical url', () => {
    const result = onBeforeRoute(makePageContext('/ru/o-nas', baseConfig) as any)
    const i18nRoute = result.pageContext.i18nRoute!
    expect(result.pageContext.locale).toBe('ru')
    expect(i18nRoute.localeConfig.currentLocale).toBe('ru')
    expect(i18nRoute.routeConfig).toMatchObject({
      requestUrl: '/ru/o-nas',
      defaultLocaleUrl: '/en/about',
      currentLocaleUrl: '/ru/o-nas',
      canonicalUrl: '/about',
      i18nUrl: '/about',
      i18nUrlParams: {},
    })
  })

  it('resolves en path to logical url', () => {
    const result = onBeforeRoute(makePageContext('/en/about', baseConfig) as any)
    expect(result.pageContext.locale).toBe('en')
    expect(result.pageContext.i18nRoute!.routeConfig.canonicalUrl).toBe('/about')
  })

  it('resolves root path correctly', () => {
    const result = onBeforeRoute(makePageContext('/ru', baseConfig) as any)
    expect(result.pageContext.locale).toBe('ru')
    expect(result.pageContext.i18nRoute!.routeConfig.canonicalUrl).toBe('/')
  })

  it('falls back to path as logical url when no route match', () => {
    const result = onBeforeRoute(makePageContext('/en/unknown-page', baseConfig) as any)
    expect(result.pageContext.i18nRoute!.routeConfig.canonicalUrl).toBe('/unknown-page')
  })

  it('stores informational domainConfig when no domain override is matched', () => {
    const result = onBeforeRoute(makePageContext('/en/about', baseConfig) as any)
    expect(result.pageContext.i18nRoute!.domainConfig).toEqual({ domain: undefined })
  })
})

describe('routes — redirects', () => {
  it('redirects / to /en', () => {
    expect(resolveRenderRedirect(makePageContext('/', baseConfig))).toBe('/en')
  })

  it('redirects /about to /en/about', () => {
    expect(resolveRenderRedirect(makePageContext('/about', baseConfig))).toBe('/en/about')
  })

  it('redirects /en/o-nas to /en/about (wrong locale translation used)', () => {
    expect(resolveRenderRedirect(makePageContext('/en/o-nas', baseConfig))).toBe('/en/about')
  })

  it('redirects /ru/about to /ru/o-nas (wrong locale translation used)', () => {
    expect(resolveRenderRedirect(makePageContext('/ru/about', baseConfig))).toBe('/ru/o-nas')
  })
})

describe('routes — integration (router + useI18nRoute)', () => {
  it('resolves canonicalUrl, localizes path, and builds alternateUrls', () => {
    const pageContext = createPageContext('https://site.com/about', {
      config: { i18n: baseConfig },
      headers: { host: 'site.com' },
    })
    const i18nRouteData = createI18nRouter('/about', pageContext)
    const i18nRoute = useI18nRoute({ ...pageContext, i18nRoute: i18nRouteData })

    expect(i18nRoute.routeConfig.canonicalUrl).toBe('/about')
    expect(i18nRoute.localizePath('/about', 'ru')).toBe('/ru/o-nas')
    expect(i18nRoute.routeConfig.alternateUrls).toEqual([
      { locale: 'en', url: '/en/about' },
      { locale: 'ru', url: '/ru/o-nas' },
    ])
  })
})
