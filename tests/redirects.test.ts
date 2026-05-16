import { describe, expect, it } from 'vitest'
import { createI18nRouter } from '../lib/core/router'
import { createPageContext } from '../lib/core/pageContext'
import type { I18nConfig } from '../lib/core/types'

function makeCtx(i18n: I18nConfig, host = 'site.com') {
  return createPageContext(`https://${host}/`, {
    config: { i18n },
    headers: { host },
  })
}

function redirect(url: string, i18n: I18nConfig) {
  const ctx = makeCtx(i18n)
  return createI18nRouter(url, ctx).routeConfig.redirectTo
}

function route(url: string, i18n: I18nConfig, host = 'site.com') {
  const ctx = makeCtx(i18n, host)
  return createI18nRouter(url, ctx).routeConfig
}

const baseConfig: I18nConfig = {
  defaultLocale: 'en',
  locales: ['en', 'ru'],
  prefixDefaultLocale: true,
  routes: {
    '/specialities/:speciality': {
      en: '/specialities/:speciality',
      ru: '/specialnosti/:speciality',
    },
    '/drugs/:country': {
      en: '/drugs/:country',
      ru: '/preparaty/:country',
    },
    '/about': {
      en: '/about',
      ru: '/o-nas',
    },
  },
}

describe('config redirects', () => {
  describe('exact path redirect', () => {
    const config: I18nConfig = {
      ...baseConfig,
      redirects: {
        '/specialities/diver': '/specialities/driver',
      },
    }

    it('redirects EN canonical path', () => {
      expect(redirect('/en/specialities/diver', config)).toBe('/en/specialities/driver')
    })

    it('redirects RU localized path automatically', () => {
      // /specialnosti/diver is the RU variant of /specialities/diver
      // The redirect should automatically apply because source is a known route key
      expect(redirect('/ru/specialnosti/diver', config)).toBe('/ru/specialnosti/driver')
    })

    it('does not redirect unrelated paths', () => {
      expect(redirect('/en/specialities/driver', config)).toBeUndefined()
    })

    it('defaults config redirects to 302', () => {
      expect(route('/en/specialities/diver', config).redirectStatus).toBe(302)
    })
  })

  describe('parametric redirect', () => {
    const config: I18nConfig = {
      ...baseConfig,
      redirects: {
        '/medicines/:country': '/drugs/:country',
      },
    }

    it('transfers named param to target', () => {
      expect(redirect('/en/medicines/ua', config)).toBe('/en/drugs/ua')
    })

    it('localizes target for RU locale', () => {
      expect(redirect('/ru/medicines/ua', config)).toBe('/ru/preparaty/ua')
    })
  })

  describe('wildcard redirect (tail stripping)', () => {
    // path-to-regexp v8 requires named wildcards: {*rest} or *rest syntax
    const config: I18nConfig = {
      ...baseConfig,
      redirects: {
        '/medicines/:country/{*rest}': '/drugs/:country',
      },
    }

    it('strips wildcard tail and transfers param', () => {
      expect(redirect('/en/medicines/ua/extra/path', config)).toBe('/en/drugs/ua')
    })

    it('works with RU locale', () => {
      expect(redirect('/ru/medicines/ua/extra/path', config)).toBe('/ru/preparaty/ua')
    })

    it('does not match without wildcard segment (path-to-regexp requires at least one segment for {*rest})', () => {
      expect(redirect('/en/medicines/ua', config)).toBeUndefined()
    })
  })

  describe('locale-scoped redirect', () => {
    const config: I18nConfig = {
      ...baseConfig,
      redirects: {
        '/about-old': {
          url: '/about',
          locales: ['en'],
        },
      },
    }

    it('redirects for allowed locale', () => {
      expect(redirect('/en/about-old', config)).toBe('/en/about')
    })

    it('does not redirect for excluded locale', () => {
      expect(redirect('/ru/about-old', config)).toBeUndefined()
    })
  })

  describe('redirect status override', () => {
    const config: I18nConfig = {
      ...baseConfig,
      redirects: {
        '/about-old': {
          url: '/about',
          status: 301,
        },
        '/preview': {
          url: '/about',
          status: 302,
        },
      },
    }

    it('uses 301 when configured', () => {
      const routeConfig = route('/en/about-old', config)

      expect(routeConfig.redirectTo).toBe('/en/about')
      expect(routeConfig.redirectStatus).toBe(301)
    })

    it('keeps 302 when configured explicitly', () => {
      const routeConfig = route('/en/preview', config)

      expect(routeConfig.redirectTo).toBe('/en/about')
      expect(routeConfig.redirectStatus).toBe(302)
    })
  })

  describe('redirect for path not in routes', () => {
    const config: I18nConfig = {
      ...baseConfig,
      redirects: {
        '/old-page': '/about',
      },
    }

    it('redirects even if source is not in routes', () => {
      expect(redirect('/en/old-page', config)).toBe('/en/about')
    })

    it('localizes target for RU locale', () => {
      expect(redirect('/ru/old-page', config)).toBe('/ru/o-nas')
    })
  })

  describe('self-redirect guard', () => {
    const config: I18nConfig = {
      ...baseConfig,
      redirects: {
        '/about': '/about',
      },
    }

    it('does not produce a self-redirect', () => {
      // /about redirecting to /about should be skipped
      expect(redirect('/en/about', config)).toBeUndefined()
    })
  })

  describe('query string preservation', () => {
    const config: I18nConfig = {
      ...baseConfig,
      redirects: {
        '/about-old': '/about',
      },
    }

    it('preserves query params through redirect', () => {
      expect(redirect('/en/about-old?foo=bar', config)).toBe('/en/about?foo=bar')
    })
  })

  describe('first-match semantics', () => {
    const config: I18nConfig = {
      ...baseConfig,
      redirects: {
        '/about-old': '/about',
        '/contact-old': '/about',
      },
    }

    it('first matching redirect wins', () => {
      expect(redirect('/en/about-old', config)).toBe('/en/about')
      expect(redirect('/en/contact-old', config)).toBe('/en/about')
    })
  })
})

describe('domain redirects', () => {
  function redirectOnDomain(url: string, i18n: I18nConfig, host: string) {
    const ctx = makeCtx(i18n, host)
    return createI18nRouter(url, ctx).routeConfig.redirectTo
  }

  const config: I18nConfig = {
    defaultLocale: 'en',
    locales: ['en', 'ru'],
    prefixDefaultLocale: true,
    routes: {
      '/about': { en: '/about', ru: '/o-nas' },
      '/old-global': { en: '/old-global', ru: '/old-global' },
    },
    redirects: {
      '/old-global': '/about',
    },
    domains: {
      'en.site.com': {
        defaultLocale: 'en',
        locales: ['en'],
        redirects: {
          '/legacy': '/about',
        },
      },
      'ru.site.com': {
        defaultLocale: 'ru',
        locales: ['ru'],
        prefixDefaultLocale: false,
        redirects: {
          '/old-global': '/about',  // domain redirect overrides global (same key)
        },
        routes: {
          '/about': { ru: '/o-sajte' },  // domain-specific route override
        },
      },
    },
  }

  it('applies domain-specific redirect on matching domain', () => {
    expect(redirectOnDomain('/legacy', config, 'en.site.com')).toBe('/en/about')
  })

  it('does not apply domain redirect on other domain', () => {
    expect(redirectOnDomain('/legacy', config, 'ru.site.com')).toBeUndefined()
  })

  it('global redirect still works on domain without its own redirect', () => {
    expect(redirectOnDomain('/en/old-global', config, 'en.site.com')).toBe('/en/about')
  })

  it('domain redirect merges with global (domain wins on same key)', () => {
    // ru.site.com has its own /old-global redirect pointing to domain-level /about
    // which uses domain routes where /about for ru = /o-sajte
    expect(redirectOnDomain('/old-global', config, 'ru.site.com')).toBe('/o-sajte')
  })

  it('preserves domain redirect status overrides', () => {
    const configWithStatus: I18nConfig = {
      ...config,
      domains: {
        ...config.domains,
        'ru.site.com': {
          ...config.domains!['ru.site.com'],
          redirects: {
            '/old-global': { url: '/about', status: 301 },
          },
        },
      },
    }

    expect(route('/old-global', configWithStatus, 'ru.site.com').redirectStatus).toBe(301)
  })

})
