import { describe, expect, it } from 'vitest'
import { createI18nRouter } from '../lib'
import { baseConfig } from './helpers/config'
import type { DetectorContext } from '../lib/core/types'

const context: DetectorContext = {
  url: 'https://site.com/about',
  pathname: '/about',
  headers: { host: 'site.com' },
  cookies: {},
  searchParams: new URL('https://site.com/about').searchParams,
}

describe('router', () => {
  it('resolves and builds urls through a single router instance', () => {
    const router = createI18nRouter(baseConfig)

    expect(router.resolve('/ru/o-nas', { context }).canonical).toBe('/about')
    expect(router.resolveCanonical('/ru/o-nas', context)).toBe('/about')
    expect(router.resolveLocalizedPath('/about', 'ru', context)).toBe('/ru/o-nas')
    expect(router.getAlternates('/about', context)).toEqual([
      { locale: 'en', url: '/en/about' },
      { locale: 'ru', url: '/ru/o-nas' },
    ])
  })
})
