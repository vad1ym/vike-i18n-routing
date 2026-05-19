import { describe, it, expect } from 'vitest'
import { createTestRouter } from './helpers/pageContext'
import { baseConfig } from './helpers/config'
import type { LocalizedPathOptions } from '../lib/core/types'

/**
 * The Link components (Vue/React/Solid) are thin wrappers that call localizePath()
 * with the props mapped to options. These tests verify the localizePath behavior
 * that Link delegates to, covering all supported props.
 */
function simulateLinkHref(
  to: string,
  locale?: string,
  opts?: { params?: Record<string, string>; query?: Record<string, string>; absolute?: boolean; prefix?: boolean },
  url = '/en/about',
) {
  const { localizePath } = createTestRouter(url, baseConfig)
  const options: LocalizedPathOptions = {}
  if (opts?.params) options.params = opts.params
  if (opts?.query) options.query = opts.query
  if (opts?.absolute !== undefined) options.absolute = opts.absolute
  if (opts?.prefix !== undefined) options.prefix = opts.prefix
  return localizePath(to, locale, Object.keys(options).length ? options : undefined)
}

describe('Link component — href resolution', () => {
  it('localizes to current locale by default', () => {
    expect(simulateLinkHref('/about', undefined, undefined, '/en/about')).toBe('/en/about')
    expect(simulateLinkHref('/about', undefined, undefined, '/ru/o-nas')).toBe('/ru/o-nas')
  })

  it('localizes to explicit locale', () => {
    expect(simulateLinkHref('/about', 'ru')).toBe('/ru/o-nas')
    expect(simulateLinkHref('/about', 'en')).toBe('/en/about')
  })

  it('localizes root path', () => {
    expect(simulateLinkHref('/', 'ru')).toBe('/ru')
    expect(simulateLinkHref('/', 'en')).toBe('/en')
  })

  it('localizes path with params', () => {
    expect(simulateLinkHref('/specialities/:speciality', 'en', { params: { speciality: 'cardiology' } }))
      .toBe('/en/specialities/cardiology')
    expect(simulateLinkHref('/specialities/:speciality', 'ru', { params: { speciality: 'cardiology' } }))
      .toBe('/ru/specialnosti/cardiology')
  })

  it('appends query string', () => {
    const href = simulateLinkHref('/about', 'en', { query: { tab: 'team' } })
    expect(href).toBe('/en/about?tab=team')
  })

  it('respects prefix: false', () => {
    const href = simulateLinkHref('/about', 'en', { prefix: false })
    expect(href).toBe('/about')
  })
})
