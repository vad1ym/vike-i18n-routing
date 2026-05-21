import { describe, it, expect } from 'vitest'
import { createTestRouter } from './helpers/pageContext'
import type { I18nConfig } from '../lib/core/types'

const config: I18nConfig = {
  defaultLocale: 'en',
  locales: ['en', 'ru', 'de'],
  routes: {
    '/': { en: '/', ru: '/', de: '/' },
    '/about': { en: '/about', ru: '/o-nas', de: '/ueber-uns' },
    '/doctors/:id': { en: '/doctors/:id', ru: '/vrachi/:id', de: '/aerzte/:id' },
  },
}

describe('SSR isolation — no data leaks between requests', () => {
  it('localizePath results are independent per request', () => {
    const router1 = createTestRouter('http://localhost/en/about', config)
    const router2 = createTestRouter('http://localhost/ru/o-nas', config)

    expect(router1.localizePath('/about', 'ru')).toBe('/ru/o-nas')
    expect(router2.localizePath('/about', 'en')).toBe('/en/about')

    // re-check: must not be affected by the other router's calls
    expect(router1.localizePath('/about', 'de')).toBe('/de/ueber-uns')
    expect(router2.localizePath('/about', 'de')).toBe('/de/ueber-uns')
  })

  it('locale of one request does not bleed into another', () => {
    const router1 = createTestRouter('http://localhost/en/about', config)
    const router2 = createTestRouter('http://localhost/ru/o-nas', config)

    expect(router1.locale).toBe('en')
    expect(router2.locale).toBe('ru')

    router2.localizePath('/about', 'de')
    expect(router1.locale).toBe('en')
  })

  it('paramVariants set on one request do not affect another', () => {
    const router1 = createTestRouter('http://localhost/en/doctors/1', config)
    const router2 = createTestRouter('http://localhost/en/doctors/2', config)

    router1.setRouteParamVariants('id', { en: 'dr-smith', ru: 'dr-smith', de: 'dr-smith' })

    // router2 must produce plain path without variants
    expect(router2.localizePath('/doctors/:id', 'ru', { params: { id: '2' } })).toBe('/ru/vrachi/2')
    // router1 still has its variants
    expect(router1.paramVariants).toBeDefined()
    expect(router2.paramVariants).toEqual({})
  })

  it('queryVariants set on one request do not affect another', () => {
    const router1 = createTestRouter('http://localhost/en/about', config)
    const router2 = createTestRouter('http://localhost/en/about', config)

    router1.setRouteQueryVariants('tab', { en: 'info', ru: 'info', de: 'info' })

    expect(router2.localizePath('/about', 'ru', { query: { tab: 'info' } })).toBe('/ru/o-nas?tab=info')
    expect(router1.queryVariants).toBeDefined()
    expect(router2.queryVariants).toEqual({})
  })

  it('different i18n configs produce correct isolated results', () => {
    const configA: I18nConfig = {
      defaultLocale: 'en',
      locales: ['en', 'ru'],
      routes: { '/page': { en: '/page', ru: '/stranitsa' } },
    }
    const configB: I18nConfig = {
      defaultLocale: 'en',
      locales: ['en', 'de'],
      routes: { '/page': { en: '/page', de: '/seite' } },
    }

    const routerA = createTestRouter('http://localhost/en/page', configA)
    const routerB = createTestRouter('http://localhost/en/page', configB)

    // each router resolves only its own locale translations
    expect(routerA.localizePath('/page', 'ru')).toBe('/ru/stranitsa')
    expect(routerA.localizePath('/page', 'en')).toBe('/en/page')
    expect(routerB.localizePath('/page', 'de')).toBe('/de/seite')
    expect(routerB.localizePath('/page', 'en')).toBe('/en/page')

    // calling routerA does not pollute routerB's cache and vice versa
    expect(routerA.localizePath('/page', 'ru')).toBe('/ru/stranitsa')
    expect(routerB.localizePath('/page', 'de')).toBe('/de/seite')
  })

  it('many sequential requests do not accumulate state', () => {
    const results: string[] = []
    for (let i = 0; i < 50; i++) {
      const locale = i % 2 === 0 ? 'en' : 'ru'
      const router = createTestRouter(`http://localhost/${locale}/about`, config)
      results.push(router.localizePath('/about', 'de'))
    }
    expect(new Set(results).size).toBe(1)
    expect(results[0]).toBe('/de/ueber-uns')
  })

  it('unknown locale throws a clear error (not crashes with _miss)', () => {
    const router = createTestRouter('http://localhost/en/about', config)
    // warm up the cache for /about
    router.localizePath('/about', 'en')
    // now request a locale not in config — must throw, not crash
    expect(() => router.localizePath('/about', 'xx' as any)).toThrow(/unknown locale/i)
  })

  it('route state is not shared between requests', () => {
    const router1 = createTestRouter('http://localhost/en/about', config)
    const router2 = createTestRouter('http://localhost/en/about', config)

    router1.setRouteParamVariants('id', { en: 'a', ru: 'b', de: 'c' })

    expect(router1.i18nRoute).not.toBe(router2.i18nRoute)
    expect(router2.paramVariants).toEqual({})
  })
})
