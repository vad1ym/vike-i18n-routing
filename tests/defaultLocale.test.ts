import { describe, it, expect } from 'vitest'
import { onBeforeRoute } from '../lib/vike/onBeforeRoute'
import { makePageContext, resolveRenderRedirect } from './helpers/pageContext'
import { baseConfig } from './helpers/config'

describe('defaultLocale', () => {
  it('redirects / to default locale prefix', () => {
    const ctx = makePageContext('/', baseConfig)
    expect(resolveRenderRedirect(ctx)).toBe('/en')
  })

  it('redirects /about to default locale prefixed path', () => {
    const ctx = makePageContext('/about', baseConfig)
    expect(resolveRenderRedirect(ctx)).toBe('/en/about')
  })

  it('redirects ru-translated path without prefix directly to canonical default locale path', () => {
    const ctx = makePageContext('/o-nas', baseConfig)
    expect(resolveRenderRedirect(ctx)).toBe('/en/about')
  })

  it('does not redirect when default locale prefix is present', () => {
    const ctx = makePageContext('/en/about', baseConfig)
    const result = onBeforeRoute(ctx as any)
    expect(result.pageContext.locale).toBe('en')
    expect(result.pageContext.i18nRoute!.logicalUrl).toBe('/about')
  })
})
