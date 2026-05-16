import { describe, expect, it } from 'vitest'
import { onBeforeRoute } from '../lib/vike/onBeforeRoute'
import { makePageContext, resolveRenderRedirect } from './helpers/pageContext'
import type { I18nConfig } from '../lib/core/types'

function getRedirectTo(pageContext: ReturnType<typeof makePageContext>) {
  return onBeforeRoute(pageContext as any).pageContext.i18nRoute?.routeConfig.redirectTo ?? null
}

const config: I18nConfig = {
  defaultLocale: 'en',
  locales: ['en', 'ru', 'fr'],
  prefixDefaultLocale: true,
  localeCookie: 'locale',
  routes: {
    '/': { en: '/', ru: '/', fr: '/' },
    '/about': { en: '/about', ru: '/o-nas', fr: '/a-propos' },
  },
  domains: {
    'site.com': {
      defaultLocale: 'en',
      locales: ['en', 'ru'],
    },
  },
}

describe('locale detection — cookie', () => {
  it('detects locale from cookie and redirects to localized path', () => {
    expect(
      resolveRenderRedirect(
        makePageContext('/about', config, {
          headers: { host: 'site.com', cookie: 'locale=ru' },
        }),
      ),
    ).toBe('/ru/o-nas')
  })

  it('can disable cookie locale detection even when localeCookie is configured', () => {
    expect(
      getRedirectTo(makePageContext('/about', {
        ...config,
        localeDetector: { localeCookie: false },
      }, {
        headers: { host: 'site.com', cookie: 'locale=ru' },
      })),
    ).toBe('/en/about')
  })
})

describe('locale detection — Accept-Language header', () => {
  it('falls back to domain locale when accept-language locale is not in domain locales', () => {
    // site.com only has en/ru — fr from header is not available
    expect(
      resolveRenderRedirect(
        makePageContext('/about', config, {
          headers: { host: 'site.com', 'accept-language': 'fr-CA,fr;q=0.8,en;q=0.5' },
        }),
      ),
    ).toBe('/en/about')
  })

  it('can disable accept-language locale detection', () => {
    expect(
      getRedirectTo(makePageContext('/about', {
        ...config,
        localeDetector: { acceptLanguageHeader: false },
      }, {
        headers: { host: 'site.com', 'accept-language': 'ru;q=1.0,en;q=0.5' },
      })),
    ).toBe('/en/about')
  })
})

describe('locale detection — query params', () => {
  it('can disable query param locale detection', () => {
    expect(
      getRedirectTo(makePageContext('/about?locale=ru', {
        ...config,
        localeDetector: { queryParams: false },
      }, {
        headers: { host: 'site.com' },
      })),
    ).toBe('/en/about')
  })
})

describe('locale detection — session', () => {
  it('can disable session locale detection', () => {
    expect(
      getRedirectTo(makePageContext('/about', {
        ...config,
        localeDetector: { session: false, acceptLanguageHeader: false },
      }, {
        headers: { host: 'site.com' },
        session: { locale: 'ru' },
      })),
    ).toBe('/en/about')
  })
})

describe('locale detection — custom function', () => {
  it('uses locale returned by custom localeDetector function', () => {
    expect(
      getRedirectTo(makePageContext('/about', {
        ...config,
        localeDetector: () => 'ru',
      }, {
        headers: { host: 'site.com' },
      })),
    ).toBe('/ru/o-nas')
  })

  it('continues built-in detection when custom function returns null', () => {
    expect(
      resolveRenderRedirect(
        makePageContext('/about', {
          ...config,
          localeDetector: () => null,
        }, {
          headers: { host: 'site.com' },
        }),
      ),
    ).toBe('/en/about')
  })
})
