import { afterEach, describe, expect, it, vi } from 'vitest'
import { onBeforeRoute } from '../lib/vike/onBeforeRoute'
import { makePageContext } from './helpers/pageContext'
import type { I18nConfig } from '../lib/core/types'

const baseConfig: I18nConfig = {
  defaultLocale: 'en',
  locales: ['en', 'ru'],
  routes: {
    '/': { en: '/', ru: '/' },
    '/about': { en: '/about', ru: '/o-nas' },
  },
}

function triggerValidation(config: I18nConfig, url = '/en/about') {
  return () => onBeforeRoute(makePageContext(url, config) as any)
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('config validation', () => {
  it('throws when defaultLocale is missing from locales', () => {
    const config: I18nConfig = {
      ...baseConfig,
      locales: ['ru', 'fr'],
    }

    expect(triggerValidation(config)).toThrow(
      '[vike-i18n] defaultLocale "en" is not listed in locales ["ru", "fr"].',
    )
  })

  it('throws when a route key does not start with slash', () => {
    const config: I18nConfig = {
      ...baseConfig,
      routes: {
        about: { en: '/about', ru: '/o-nas' },
      },
    }

    expect(triggerValidation(config)).toThrow(
      '[vike-i18n] routes key "about" must start with "/".',
    )
  })

  it('throws when a grouped route key does not start with slash', () => {
    const config: I18nConfig = {
      ...baseConfig,
      routes: {
        '/blog': {
          post: { en: '/post', ru: '/post' },
        },
      },
    }

    expect(triggerValidation(config)).toThrow(
      '[vike-i18n] routes key "post" must start with "/".',
    )
  })

  it('throws when locales reuse the same urlPrefix', () => {
    const config: I18nConfig = {
      ...baseConfig,
      locales: {
        en: { urlPrefix: 'en' },
        ru: { urlPrefix: 'en' },
      },
    }

    expect(triggerValidation(config)).toThrow(
      '[vike-i18n] duplicate urlPrefix "en". Locales "en" and "ru" cannot share the same prefix.',
    )
  })

  it('warns when a redirect target does not match any route key', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const config: I18nConfig = {
      ...baseConfig,
      redirects: {
        '/old-about': '/unknown',
      },
    }

    triggerValidation(config)()

    expect(warn).toHaveBeenCalledWith(
      '[vike-i18n] redirect target "/unknown" does not match any route key.',
    )
  })

  it('throws when domain defaultLocale is missing from domain locales', () => {
    const config: I18nConfig = {
      ...baseConfig,
      domains: {
        'ru.site.com': {
          defaultLocale: 'en',
          locales: ['ru'],
        },
      },
    }

    expect(triggerValidation(config, '/about')).toThrow(
      '[vike-i18n] defaultLocale "en" is not listed in domains["ru.site.com"] locales ["ru"].',
    )
  })

  it('warns when a merged domain redirect target does not match any route key', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const config: I18nConfig = {
      ...baseConfig,
      domains: {
        'ru.site.com': {
          defaultLocale: 'ru',
          locales: ['ru'],
          redirects: {
            '/legacy': '/missing-domain-route',
          },
        },
      },
    }

    onBeforeRoute(makePageContext('/legacy', config, { headers: { host: 'ru.site.com' } }) as any)

    expect(warn).toHaveBeenCalledWith(
      '[vike-i18n] redirect target "/missing-domain-route" in domains["ru.site.com"] does not match any route key.',
    )
  })
})
