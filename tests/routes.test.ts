import { describe, it, expect } from 'vitest'
import { onBeforeRoute } from '../lib/vike/onBeforeRoute'
import { makePageContext, getRedirectUrl } from './helpers/pageContext'
import { baseConfig } from './helpers/config'

describe('routes — translated paths', () => {
  it('resolves ru translated path to logical url', () => {
    const result = onBeforeRoute(makePageContext('/ru/o-nas', baseConfig) as any)
    const i18nRoute = result.pageContext.i18nRoute!
    expect(result.pageContext.locale).toBe('ru')
    expect(i18nRoute.requestConfig.locale).toBe('en')
    expect(i18nRoute.localeConfig.currentLocale).toBe('ru')
    expect(i18nRoute.routeConfig).toMatchObject({
      requestUrl: '/ru/o-nas',
      defaultLocaleUrl: '/en/about',
      currentLocaleUrl: '/ru/o-nas',
      vikeUrl: '/about',
      i18nUrl: '/about',
      vikeUrlParams: {},
      i18nUrlParams: {},
    })
  })

  it('resolves en path to logical url', () => {
    const result = onBeforeRoute(makePageContext('/en/about', baseConfig) as any)
    expect(result.pageContext.locale).toBe('en')
    expect(result.pageContext.i18nRoute!.routeConfig.vikeUrl).toBe('/about')
  })

  it('resolves root path correctly', () => {
    const result = onBeforeRoute(makePageContext('/ru', baseConfig) as any)
    expect(result.pageContext.locale).toBe('ru')
    expect(result.pageContext.i18nRoute!.routeConfig.vikeUrl).toBe('/')
  })

  it('falls back to path as logical url when no route match', () => {
    const result = onBeforeRoute(makePageContext('/en/unknown-page', baseConfig) as any)
    expect(result.pageContext.i18nRoute!.routeConfig.vikeUrl).toBe('/unknown-page')
  })

  it('stores informational domainConfig when no domain override is matched', () => {
    const result = onBeforeRoute(makePageContext('/en/about', baseConfig) as any)
    expect(result.pageContext.i18nRoute!.domainConfig).toEqual({ domain: undefined })
  })
})

describe('routes — redirects', () => {
  it('redirects / to /en', () => {
    let redirectTo: string | null = null
    try { onBeforeRoute(makePageContext('/', baseConfig) as any) } catch (e) {
      redirectTo = getRedirectUrl(e)
    }
    expect(redirectTo).toBe('/en')
  })

  it('redirects /about to /en/about', () => {
    let redirectTo: string | null = null
    try { onBeforeRoute(makePageContext('/about', baseConfig) as any) } catch (e) {
      redirectTo = getRedirectUrl(e)
    }
    expect(redirectTo).toBe('/en/about')
  })

  it('redirects /en/o-nas to /en/about (wrong locale translation used)', () => {
    let redirectTo: string | null = null
    try { onBeforeRoute(makePageContext('/en/o-nas', baseConfig) as any) } catch (e) {
      redirectTo = getRedirectUrl(e)
    }
    expect(redirectTo).toBe('/en/about')
  })

  it('redirects /ru/about to /ru/o-nas (wrong locale translation used)', () => {
    let redirectTo: string | null = null
    try { onBeforeRoute(makePageContext('/ru/about', baseConfig) as any) } catch (e) {
      redirectTo = getRedirectUrl(e)
    }
    expect(redirectTo).toBe('/ru/o-nas')
  })
})
