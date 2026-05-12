import { describe, expect, it } from 'vitest'
import {
  getAlternates,
  setRouteSlugVariants,
  toCanonicalUrl,
  toLocalizedUrl,
} from '../lib'
import { createSetCookieHeader, resolveCookieAction } from '../lib/core/cookies'
import { onBeforeRoute } from '../lib/vike/onBeforeRoute'
import { makePageContext, getRedirectUrl } from './helpers/pageContext'
import type { DetectorContext, I18nConfig } from '../lib/core/types'

const context: DetectorContext = {
  url: 'https://site.com/about',
  pathname: '/about',
  headers: { host: 'site.com' },
  cookies: {},
  searchParams: new URL('https://site.com/about').searchParams,
}

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

    expect(result.pageContext.canonical).toBe('/services/design')
    expect(toLocalizedUrl('/services/design/specs', 'ru', domainConfig, { context })).toBe(
      '/ru/uslugi/design/specs',
    )
  })

  it('uses slug variants for params and redirects foreign variants', () => {
    setRouteSlugVariants(
      'category',
      {
        en: 'web-development',
        ru: 'veb-razrabotka',
        fr: 'developpement-web',
      },
      { redirect: true },
    )

    const ruResult = onBeforeRoute(
      makePageContext('/ru/uslugi/veb-razrabotka', domainConfig, {
        headers: { host: 'site.com' },
      }) as any,
    )
    expect(ruResult.pageContext.canonical).toBe('/services/web-development')

    try {
      onBeforeRoute(
        makePageContext('/en/services/veb-razrabotka', domainConfig, {
          headers: { host: 'site.com' },
        }) as any,
      )
    } catch (error) {
      expect(getRedirectUrl(error)).toBe('/en/services/web-development')
    }

    expect(
      toLocalizedUrl('/services/web-development', 'fr', domainConfig, {
        context: {
          ...context,
          url: 'https://site.fr/services-fr/developpement-web',
          pathname: '/services-fr/developpement-web',
          headers: { host: 'site.fr' },
          domain: 'site.fr',
          searchParams: new URL('https://site.fr/services-fr/developpement-web').searchParams,
        },
      }),
    ).toBe('/services-fr/developpement-web')
  })

  it('builds canonical URLs and alternates from the shared resolver', () => {
    expect(toCanonicalUrl('/ru/o-nas', domainConfig, { context })).toBe('/en/about')
    expect(
      toCanonicalUrl('/fr/a-propos', domainConfig, {
        context: {
          ...context,
          url: 'https://site.fr/a-propos',
          pathname: '/a-propos',
          headers: { host: 'site.fr' },
          domain: 'site.fr',
          searchParams: new URL('https://site.fr/a-propos').searchParams,
        },
      }),
    ).toBe('/a-propos')

    expect(getAlternates('/about', domainConfig, { context })).toEqual([
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
