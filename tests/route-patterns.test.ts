import { describe, it, expect } from 'vitest'
import { normalizeRoutePattern, buildRoutePath, matchRoutePattern } from '../lib/core/route-patterns'

describe('normalizeRoutePattern — @param alias', () => {
  it('converts @param to :param', () => {
    expect(normalizeRoutePattern('/path/@id')).toBe('/path/:id')
  })

  it('converts multiple @params', () => {
    expect(normalizeRoutePattern('/blog/@category/@slug')).toBe('/blog/:category/:slug')
  })

  it('leaves :param syntax unchanged', () => {
    expect(normalizeRoutePattern('/path/:id')).toBe('/path/:id')
  })

  it('leaves static paths unchanged', () => {
    expect(normalizeRoutePattern('/about')).toBe('/about')
  })
})

describe('buildRoutePath — @param syntax', () => {
  it('builds path using @param pattern', () => {
    expect(buildRoutePath('/blog/@category/@slug', { category: 'news', slug: 'hello' })).toBe(
      '/blog/news/hello',
    )
  })
})

describe('matchRoutePattern — @param syntax', () => {
  it('matches path using @param pattern', () => {
    expect(matchRoutePattern('/blog/@category/@slug', '/blog/news/hello')).toEqual({
      category: 'news',
      slug: 'hello',
    })
  })

  it('returns null for non-matching path', () => {
    expect(matchRoutePattern('/blog/@slug', '/about')).toBeNull()
  })
})
