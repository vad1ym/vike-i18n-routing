import { describe, expect, it } from 'vitest'
import { createI18nRouter, createPageContext } from '../lib'
import { baseConfig } from './helpers/config'

const pageContext = createPageContext('https://site.com/about', {
  config: { i18n: baseConfig },
  headers: { host: 'site.com' },
})

describe('router', () => {
  it('resolves and builds urls through a single router instance', () => {
    const router = createI18nRouter(pageContext)

    expect(router.resolve('/ru/o-nas').i18nRoute.routeConfig.vikeUrl).toBe('/about')
    expect(router.resolveLocalizedPath('/about', 'ru')).toBe('/ru/o-nas')
    expect(router.resolve('/about').i18nRoute.routeConfig.alternateUrls).toEqual([
      { locale: 'en', url: '/en/about' },
      { locale: 'ru', url: '/ru/o-nas' },
    ])
  })
})
