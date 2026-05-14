import { describe, expect, it } from 'vitest'
import { createPageContext } from '../lib/core/pageContext'
import { createI18nRouter } from '../lib/core/router'
import { baseConfig } from './helpers/config'

const pageContext = createPageContext('https://site.com/about', {
  config: { i18n: baseConfig },
  headers: { host: 'site.com' },
})

describe('router', () => {
  it('resolves and builds urls through a single router instance', () => {
    const i18nRoute = createI18nRouter('/about', pageContext)

    expect(i18nRoute.routeConfig.vikeUrl).toBe('/about')
    expect(i18nRoute.localizePath('/about', 'ru')).toBe('/ru/o-nas')
    expect(i18nRoute.routeConfig.alternateUrls).toEqual([
      { locale: 'en', url: '/en/about' },
      { locale: 'ru', url: '/ru/o-nas' },
    ])
  })
})
