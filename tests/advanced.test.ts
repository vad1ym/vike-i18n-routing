import { describe, expect, it } from 'vitest'
import { createSetCookieHeader, resolveCookieAction } from '../lib/core/cookies'
import { createPageContext } from '../lib/core/pageContext'
import { createI18nRouter } from '../lib/core/router'
import { useI18nRoute } from '../lib/core/useI18nRoute'
import type { I18nConfig } from '../lib/core/types'

// Tests that don't belong to a single focused feature file.
// Locale detection → locale-detection.test.ts
// Param variants / localizePath → params.test.ts
// Query variants → query-variants.test.ts
// Domain config / wildcard → domains.test.ts

const config: I18nConfig = {
  defaultLocale: 'en',
  locales: ['en', 'ru'],
  prefixDefaultLocale: true,
  localeCookie: 'locale',
  routes: {
    '/about': { en: '/about', ru: '/o-nas' },
  },
}

describe('cookie serialization', () => {
  it('builds Set-Cookie header with correct attributes', () => {
    const action = resolveCookieAction('ru', config)
    expect(action?.name).toBe('locale')
    expect(createSetCookieHeader(action!)).toBe('locale=ru; Path=/; SameSite=Lax; HttpOnly')
  })
})

describe('alternate URLs', () => {
  it('builds alternateUrls from createI18nRouter', () => {
    const pageContext = createPageContext('https://site.com/about', {
      config: { i18n: config },
      headers: { host: 'site.com' },
    })
    expect(createI18nRouter('/about', pageContext).routeConfig.alternateUrls).toEqual([
      { locale: 'en', url: '/en/about' },
      { locale: 'ru', url: '/ru/o-nas' },
    ])
  })

  it('builds alternateUrls with localized slugs after setRouteParamVariants', () => {
    const paramConfig: I18nConfig = {
      defaultLocale: 'en',
      locales: ['en', 'ru'],
      prefixDefaultLocale: true,
      routes: {
        '/services/:category': {
          en: '/services/:category',
          ru: '/uslugi/:category',
        },
      },
    }
    const pc = createPageContext('https://site.com/en/services/web-development', {
      config: { i18n: paramConfig },
      headers: { host: 'site.com' },
    })
    const i18nRoute = useI18nRoute({ ...pc, i18nRoute: createI18nRouter('/en/services/web-development', pc) } as any)
    i18nRoute.setRouteParamVariants('category', { en: 'web-development', ru: 'veb-razrabotka' })

    expect(i18nRoute.routeConfig.alternateUrls).toEqual([
      { locale: 'en', url: '/en/services/web-development' },
      { locale: 'ru', url: '/ru/uslugi/veb-razrabotka' },
    ])
  })
})
