import { describe, it, expect } from 'vitest'
import { onBeforeRoute } from '../lib/vike/onBeforeRoute'
import { makePageContext, getRedirectUrl } from './helpers/pageContext'
import { baseConfig } from './helpers/config'

describe('routes — translated paths', () => {
  it('resolves ru translated path to logical url', () => {
    const result = onBeforeRoute(makePageContext('/ru/o-nas', baseConfig) as any)
    expect(result.pageContext.canonical).toBe('/about')
    expect(result.pageContext.urlPathname).toBe('/about')
    expect(result.pageContext.locale).toBe('ru')
  })

  it('resolves en path to logical url', () => {
    const result = onBeforeRoute(makePageContext('/en/about', baseConfig) as any)
    expect(result.pageContext.canonical).toBe('/about')
    expect(result.pageContext.urlPathname).toBe('/about')
    expect(result.pageContext.locale).toBe('en')
  })

  it('resolves root path correctly', () => {
    const result = onBeforeRoute(makePageContext('/ru', baseConfig) as any)
    expect(result.pageContext.canonical).toBe('/')
    expect(result.pageContext.urlPathname).toBe('/')
    expect(result.pageContext.locale).toBe('ru')
  })

  it('falls back to path as logical url when no route match', () => {
    const result = onBeforeRoute(makePageContext('/en/unknown-page', baseConfig) as any)
    expect(result.pageContext.canonical).toBe('/unknown-page')
    expect(result.pageContext.urlPathname).toBe('/unknown-page')
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
