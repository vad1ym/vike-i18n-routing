import { describe, expect, it } from 'vitest'
import { createSetCookieHeader, resolveCookieAction } from '../lib/core/cookies'
import { createPageContext } from '../lib/core/pageContext'
import { createI18nRouter } from '../lib/core/router'
import { getAlternates, toLocalizedUrl } from '../lib/core/utils'
import { onBeforeRoute } from '../lib/vike/onBeforeRoute'
import { makePageContext, getRedirectUrl } from './helpers/pageContext'
import type { I18nConfig } from '../lib/core/types'

const domainConfig: I18nConfig = {
  defaultLocale: 'en',
  locales: ['en', 'ru', 'fr'],
  prefixDefaultLocale: true,
  domains: {
    'site.com': {
      defaultLocale: 'en',
      locales: ['en', 'ru'],
    },
    'site.fr': {
      defaultLocale: 'fr',
      locales: ['fr', 'en'],
      prefixDefaultLocale: false,
      meta: {
        supportedAuthCountries: ['fr', 'uk', 'ru'],
      },
    },
  },
  routes: {
    '/': { en: '/', ru: '/', fr: '/' },
    '/about': { en: '/about', ru: '/o-nas', fr: '/a-propos' },
    '/services/:category{/:tab}': {
      en: '/services/:category{/:tab}',
      ru: '/uslugi/:category{/:tab}',
      fr: '/services-fr/:category{/:tab}',
    },
  },
  localeCookie: 'locale',
}

const pageContext = createPageContext('https://site.com/about', {
  config: { i18n: domainConfig },
  headers: { host: 'site.com' },
})

describe('advanced features', () => {
  it('detects locale from cookie and accept-language', () => {
    try {
      onBeforeRoute(
        makePageContext('/about', domainConfig, {
          headers: { host: 'site.com', cookie: 'locale=ru' },
        }) as any,
      )
    } catch (error) {
      expect(getRedirectUrl(error)).toBe('/ru/o-nas')
    }

    try {
      onBeforeRoute(
        makePageContext('/about', domainConfig, {
          headers: { host: 'site.com', 'accept-language': 'fr-CA,fr;q=0.8,en;q=0.5' },
        }) as any,
      )
    } catch (error) {
      expect(getRedirectUrl(error)).toBe('/en/about')
    }
  })

  it('matches optional segments and localizes them', () => {
    const result = onBeforeRoute(
      makePageContext('/ru/uslugi/design', domainConfig, {
        headers: { host: 'site.com' },
      }) as any,
    )

    expect(result.pageContext.i18nRoute!.routeConfig.vikeUrl).toBe('/services/design')
    expect(toLocalizedUrl('/services/design/specs', 'ru', pageContext)).toBe(
      '/ru/uslugi/design/specs',
    )
  })

  it('uses slug variants for params and redirects foreign variants', () => {
    const routeParamVariants = {
      en: 'web-development',
      ru: 'veb-razrabotka',
      fr: 'developpement-web',
    }

    const ruPageContext = makePageContext('/ru/uslugi/veb-razrabotka', domainConfig, {
      headers: { host: 'site.com' },
    }) as any
    createI18nRouter('/ru/uslugi/veb-razrabotka', ruPageContext)
      .setRouteParamVariants('category', routeParamVariants)

    const ruResult = onBeforeRoute(ruPageContext)
    expect(ruResult.pageContext.i18nRoute!.routeConfig.vikeUrl).toBe('/services/web-development')

    const invalidEnPageContext = makePageContext('/en/services/veb-razrabotka', domainConfig, {
      headers: { host: 'site.com' },
    }) as any
    createI18nRouter('/en/services/veb-razrabotka', invalidEnPageContext)
      .setRouteParamVariants('category', routeParamVariants)

    try {
      onBeforeRoute(invalidEnPageContext)
    } catch (error) {
      expect(getRedirectUrl(error)).toBe('/en/services/web-development')
    }

    const frPageContext = createPageContext('https://site.fr/services-fr/developpement-web', {
      config: { i18n: domainConfig },
      headers: { host: 'site.fr' },
      domain: 'site.fr',
    })
    createI18nRouter('/services-fr/developpement-web', frPageContext)
      .setRouteParamVariants('category', routeParamVariants)

    expect(
      toLocalizedUrl('/services/web-development', 'fr', frPageContext),
    ).toBe('/services-fr/developpement-web')
  })

  it('updates pageContext.i18nRoute.routeConfig after setRouteParamVariants', () => {
    const result = onBeforeRoute(
      makePageContext('/en/services/web-development', domainConfig, {
        headers: { host: 'site.com' },
      }) as any,
    )
    const i18nRoute = result.pageContext.i18nRoute!

    i18nRoute.setRouteParamVariants(
      'category',
      {
        en: 'web-development',
        ru: 'veb-razrabotka',
        fr: 'developpement-web',
      },
    )

    expect(i18nRoute.routeConfig.redirectTo).toBeUndefined()
    expect(i18nRoute.routeConfig.currentLocaleUrl).toBe('/en/services/web-development')
    expect(i18nRoute.routeConfig.defaultLocaleUrl).toBe('/en/services/web-development')
    expect(i18nRoute.routeConfig.alternateUrls).toEqual([
      { locale: 'en', url: '/en/services/web-development' },
      { locale: 'ru', url: '/ru/uslugi/veb-razrabotka' },
    ])
  })

  it('builds alternates from the shared resolver', () => {
    expect(getAlternates('/about', pageContext)).toEqual([
      { locale: 'en', url: '/en/about' },
      { locale: 'ru', url: '/ru/o-nas' },
    ])
  })

  it('serializes locale cookies via the renamed cookie helper', () => {
    const action = resolveCookieAction('ru', domainConfig)
    expect(action?.name).toBe('locale')
    expect(createSetCookieHeader(action!)).toBe('locale=ru; Path=/; SameSite=Lax; HttpOnly')
  })
})
