import { describe, expect, it } from 'vitest'
import { resolveDomainConfig } from '../lib/core/domain/normalize'
import { createPageContext } from '../lib/core/pageContext'
import { createI18nRouter } from '../lib/core/router'
import { onBeforeRoute } from '../lib/vike/onBeforeRoute'
import { makePageContext, resolveRenderRedirect } from './helpers/pageContext'
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
}

function makeCtx(host: string, url = '/') {
  return createPageContext(`https://${host}${url}`, {
    config: { i18n: domainConfig },
    headers: { host },
  })
}

describe('domains — basic resolution', () => {
  it('resolves domain-specific default locale', () => {
    const result = onBeforeRoute(makeCtx('site.fr', '/a-propos') as any)
    expect(result.pageContext.locale).toBe('fr')
    expect(result.pageContext.i18nRoute!.routeConfig.canonicalUrl).toBe('/about')
  })

  it('exposes domain meta in domainConfig', () => {
    const result = onBeforeRoute(makeCtx('site.fr', '/a-propos') as any)
    expect(result.pageContext.i18nRoute!.domainConfig.meta).toEqual({
      supportedAuthCountries: ['fr', 'uk', 'ru'],
    })
  })

  it('stores domain: undefined when no domain override matched', () => {
    const result = onBeforeRoute(makePageContext('/en/about', domainConfig) as any)
    expect(result.pageContext.i18nRoute!.domainConfig).toEqual({ domain: undefined })
  })
})

describe('domains — locale metadata', () => {
  const config: I18nConfig = {
    defaultLocale: 'en',
    locales: {
      en: {
        urlPrefix: 'en',
        meta: { currency: 'USD', region: 'global', dateFormat: 'MM/DD/YYYY' },
      },
      de: {
        urlPrefix: 'de',
        meta: { currency: 'EUR', region: 'global', dateFormat: 'DD.MM.YYYY' },
      },
    },
    routes: {
      '/about': { en: '/about', de: '/uber' },
    },
    domains: {
      'site.de': {
        defaultLocale: 'de',
        locales: {
          de: {
            urlPrefix: 'de',
            meta: { region: 'de' },
          },
          en: {
            urlPrefix: 'en',
            meta: { region: 'eu' },
          },
        },
      },
    },
  }

  it('merges domain locale meta with base locale config', () => {
    const result = onBeforeRoute(createPageContext('https://site.de/de/uber', {
      config: { i18n: config },
      headers: { host: 'site.de' },
    }) as any)

    expect(result.pageContext.i18nRoute!.localeConfig.currentLocaleMeta).toEqual({
      currency: 'EUR',
      region: 'de',
      dateFormat: 'DD.MM.YYYY',
    })
    expect(result.pageContext.i18nRoute!.localeConfig.locales.en.meta).toEqual({
      currency: 'USD',
      region: 'eu',
      dateFormat: 'MM/DD/YYYY',
    })
  })

  it('keeps base locale meta when domain uses locale array subset', () => {
    const arraySubsetConfig: I18nConfig = {
      ...config,
      domains: {
        'site.de': {
          defaultLocale: 'de',
          locales: ['de'],
        },
      },
    }

    const resolved = resolveDomainConfig(
      arraySubsetConfig,
      createPageContext('https://site.de/de/uber', {
        config: { i18n: arraySubsetConfig },
        headers: { host: 'site.de' },
      }),
    )

    expect(resolved.locales.de.meta).toEqual({
      currency: 'EUR',
      region: 'global',
      dateFormat: 'DD.MM.YYYY',
    })
  })
})

describe('domains — wildcard matching', () => {
  const wildcardConfig: I18nConfig = {
    ...domainConfig,
    domains: {
      '*.site.com': {
        defaultLocale: 'en',
        locales: ['en'],
        prefixDefaultLocale: false,
      },
    },
  }

  it('matches wildcard domain when no exact config exists', () => {
    const resolved = resolveDomainConfig(
      wildcardConfig,
      createPageContext('https://tenant1.site.com/about', {
        config: { i18n: wildcardConfig },
        headers: { host: 'tenant1.site.com' },
      }),
    )

    expect(resolved).toMatchObject({
      domain: 'tenant1.site.com',
      defaultLocale: 'en',
      prefixDefaultLocale: false,
    })
  })

  it('prefers exact domain config over wildcard', () => {
    const mixedConfig: I18nConfig = {
      ...domainConfig,
      domains: {
        '*.site.com': {
          defaultLocale: 'en',
          locales: ['en'],
          prefixDefaultLocale: false,
        },
        'tenant1.site.com': {
          defaultLocale: 'ru',
          locales: ['ru', 'en'],
          prefixDefaultLocale: true,
        },
      },
    }

    const resolved = resolveDomainConfig(
      mixedConfig,
      createPageContext('https://tenant1.site.com/about', {
        config: { i18n: mixedConfig },
        headers: { host: 'tenant1.site.com' },
      }),
    )

    expect(resolved).toMatchObject({
      domain: 'tenant1.site.com',
      defaultLocale: 'ru',
      prefixDefaultLocale: true,
    })
    expect(Object.keys(resolved.locales)).toEqual(['ru', 'en'])
  })

  it('prefers more specific wildcard over less specific', () => {
    const nestedWildcardConfig: I18nConfig = {
      ...domainConfig,
      domains: {
        '*.site.com': {
          defaultLocale: 'en',
          locales: ['en'],
          prefixDefaultLocale: false,
        },
        '*.fr.site.com': {
          defaultLocale: 'fr',
          locales: ['fr', 'en'],
          prefixDefaultLocale: true,
        },
      },
    }

    const resolved = resolveDomainConfig(
      nestedWildcardConfig,
      createPageContext('https://tenant.fr.site.com/about', {
        config: { i18n: nestedWildcardConfig },
        headers: { host: 'tenant.fr.site.com' },
      }),
    )

    expect(resolved).toMatchObject({
      domain: 'tenant.fr.site.com',
      defaultLocale: 'fr',
      prefixDefaultLocale: true,
    })
    expect(Object.keys(resolved.locales)).toEqual(['fr', 'en'])
  })
})

describe('domains — per-domain routes', () => {
  const config: I18nConfig = {
    defaultLocale: 'en',
    locales: ['en', 'ru'],
    prefixDefaultLocale: true,
    routes: {
      '/about': { en: '/about', ru: '/o-nas' },
      '/services': { en: '/services', ru: '/uslugi' },
    },
    domains: {
      'ru.site.com': {
        defaultLocale: 'ru',
        locales: ['ru'],
        prefixDefaultLocale: false,
        routes: {
          '/about': { ru: '/o-sajte' },
        },
      },
    },
  }

  function makeRuCtx(url: string) {
    return createPageContext(`https://ru.site.com${url}`, {
      config: { i18n: config },
      headers: { host: 'ru.site.com' },
    })
  }

  it('domain route override resolves canonical correctly', () => {
    expect(createI18nRouter('/o-sajte', makeRuCtx('/o-sajte')).routeConfig.canonicalUrl).toBe('/about')
  })

  it('domain route override builds correct localized URL', () => {
    expect(createI18nRouter('/o-sajte', makeRuCtx('/o-sajte')).routeConfig.currentLocaleUrl).toBe('/o-sajte')
  })

  it('non-overridden global route still works on domain', () => {
    expect(createI18nRouter('/uslugi', makeRuCtx('/uslugi')).routeConfig.canonicalUrl).toBe('/services')
  })

  it('global route uses global translation on other domain', () => {
    const ctx = createPageContext('https://site.com/ru/o-nas', {
      config: { i18n: config },
      headers: { host: 'site.com' },
    })
    expect(createI18nRouter('/ru/o-nas', ctx).routeConfig.canonicalUrl).toBe('/about')
  })
})

describe('domains — per-domain redirects', () => {
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
          '/old-global': '/about',
        },
        routes: {
          '/about': { ru: '/o-sajte' },
        },
      },
    },
  }

  function redirectOnDomain(url: string, host: string) {
    const ctx = createPageContext(`https://${host}/`, {
      config: { i18n: config },
      headers: { host },
    })
    return createI18nRouter(url, ctx).routeConfig.redirectTo
  }

  it('applies domain-specific redirect on matching domain', () => {
    expect(redirectOnDomain('/legacy', 'en.site.com')).toBe('/en/about')
  })

  it('does not apply domain redirect on other domain', () => {
    expect(redirectOnDomain('/legacy', 'ru.site.com')).toBeUndefined()
  })

  it('global redirect still works on domain without its own redirect for that key', () => {
    expect(redirectOnDomain('/en/old-global', 'en.site.com')).toBe('/en/about')
  })

  it('domain redirect wins over global on same key', () => {
    // ru.site.com overrides /old-global redirect; its /about route = /o-sajte
    expect(redirectOnDomain('/old-global', 'ru.site.com')).toBe('/o-sajte')
  })
})
