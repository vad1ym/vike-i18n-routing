import { describe, it, expect } from 'vitest'
import { onBeforeRoute } from '../lib/vike/onBeforeRoute'
import { makePageContext, getRedirectUrl } from './helpers/pageContext'
import { baseConfig } from './helpers/config'

describe('defaultLocale', () => {
  it('redirects / to default locale prefix', () => {
    const ctx = makePageContext('/', baseConfig)
    expect(() => onBeforeRoute(ctx as any)).toThrow()

    try {
      onBeforeRoute(ctx as any)
    } catch (e) {
      expect(getRedirectUrl(e)).toBe('/en')
    }
  })

  it('redirects /about to default locale prefixed path', () => {
    const ctx = makePageContext('/about', baseConfig)
    try {
      onBeforeRoute(ctx as any)
    } catch (e) {
      expect(getRedirectUrl(e)).toBe('/en/about')
    }
  })

  it('redirects ru-translated path without prefix directly to canonical default locale path', () => {
    const ctx = makePageContext('/o-nas', baseConfig)
    try {
      onBeforeRoute(ctx as any)
    } catch (e) {
      expect(getRedirectUrl(e)).toBe('/en/about')
    }
  })

  it('does not redirect when default locale prefix is present', () => {
    const ctx = makePageContext('/en/about', baseConfig)
    const result = onBeforeRoute(ctx as any)
    expect(result.pageContext.locale).toBe('en')
    expect(result.pageContext.i18nRoute!.routeConfig.canonicalUrl).toBe('/about')
  })
})
