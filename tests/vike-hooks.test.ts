import { describe, expect, it } from 'vitest'
import { onBeforeRender } from '../lib/vike/onBeforeRender'
import { onBeforeRoute } from '../lib/vike/onBeforeRoute'
import { headersResponse } from '../lib/vike/headersResponse'
import { createI18nRouter } from '../lib/core/router'
import { useI18nRoute } from '../lib/core/useI18nRoute'
import { createPageContext } from '../lib/core/pageContext'
import { getRedirectUrl, makePageContext } from './helpers/pageContext'
import type { I18nConfig } from '../lib/core/types'

const config: I18nConfig = {
  defaultLocale: 'en',
  locales: ['en', 'ru'],
  prefixDefaultLocale: true,
  localeCookie: 'locale',
  routes: {
    '/about': { en: '/about', ru: '/o-nas' },
    '/services/:category': {
      en: '/services/:category',
      ru: '/uslugi/:category',
    },
  },
}

describe('onBeforeRoute', () => {
  it('throws redirect with configured status', () => {
    const configWithRedirect: I18nConfig = {
      ...config,
      redirects: { '/about/old': { url: '/about', status: 301 } },
    }
    try {
      onBeforeRoute(makePageContext('/en/about/old', configWithRedirect) as any)
    } catch (error) {
      expect(getRedirectUrl(error)).toBe('/en/about')
      expect((error as any)._pageContextAbort._urlRedirect.statusCode).toBe(301)
      return
    }

    throw new Error('Expected redirect to be thrown')
  })

  it('sets the locale cookie of the redirect target on the redirect response', () => {
    const pageContext = makePageContext('/about?lang=ru', config) as any

    expect(() => onBeforeRoute(pageContext)).toThrow()
    expect(pageContext.headersResponse).toBeInstanceOf(Headers)
    expect(pageContext.headersResponse.getSetCookie()).toEqual([
      'locale=ru; Path=/; SameSite=Lax; HttpOnly',
    ])
  })

  it('appends to an existing headersResponse', () => {
    const pageContext = makePageContext('/about?lang=ru', config) as any
    pageContext.headersResponse = new Headers([['Set-Cookie', 'session=abc']])

    expect(() => onBeforeRoute(pageContext)).toThrow()
    expect(pageContext.headersResponse.getSetCookie()).toEqual([
      'session=abc',
      'locale=ru; Path=/; SameSite=Lax; HttpOnly',
    ])
  })

  it('does not set a cookie on the client or when localeCookie is disabled', () => {
    const clientContext = { ...makePageContext('/about?lang=ru', config), isClientSide: true } as any
    expect(() => onBeforeRoute(clientContext)).toThrow()
    expect(clientContext.headersResponse).toBeUndefined()

    const noCookieContext = makePageContext('/about?lang=ru', { ...config, localeCookie: false }) as any
    expect(() => onBeforeRoute(noCookieContext)).toThrow()
    expect(noCookieContext.headersResponse).toBeUndefined()
  })
})

describe('headersResponse', () => {
  it('returns the locale cookie for the rendered page', () => {
    expect(headersResponse({ config: { i18n: config }, locale: 'ru' } as any)).toEqual({
      'Set-Cookie': 'locale=ru; Path=/; SameSite=Lax; HttpOnly',
    })
  })

  it('returns no headers when localeCookie is disabled or locale is missing', () => {
    expect(headersResponse({ config: { i18n: { ...config, localeCookie: false } }, locale: 'ru' } as any)).toEqual({})
    expect(headersResponse({ config: { i18n: config } } as any)).toEqual({})
  })
})

describe('onBeforeRender', () => {
  it('passes runtime variants to the client', () => {
    const result = onBeforeRender({
      i18nRoute: {
        paramVariants: {
          category: {
            variants: { en: 'web-development', ru: 'veb-razrabotka' },
          },
        },
        queryVariants: {
          focus: {
            variants: { en: 'frontend', ru: 'frontend-ru' },
          },
        },
      },
    } as any)

    expect(result).toEqual({
      pageContext: {
        i18nParamVariants: {
          category: {
            variants: { en: 'web-development', ru: 'veb-razrabotka' },
          },
        },
        i18nQueryVariants: {
          focus: {
            variants: { en: 'frontend', ru: 'frontend-ru' },
          },
        },
      },
    })
  })
})

describe('useI18nRoute hydration restore', () => {
  it('restores param and query variants passed from SSR', () => {
    const pageContext = createPageContext('https://site.com/en/services/web-development?focus=frontend', {
      config: { i18n: config },
      headers: { host: 'site.com' },
    })
    const i18nRoute = createI18nRouter('/en/services/web-development?focus=frontend', pageContext)

    expect(i18nRoute.paramVariants).toEqual({})
    expect(i18nRoute.queryVariants).toEqual({})

    const restored = useI18nRoute({
      ...pageContext,
      urlOriginal: '/en/services/web-development?focus=frontend',
      i18nRoute,
      i18nParamVariants: {
        category: {
          variants: { en: 'web-development', ru: 'veb-razrabotka' },
        },
      },
      i18nQueryVariants: {
        focus: {
          variants: { en: 'frontend', ru: 'frontend-ru' },
        },
      },
    } as any)

    expect(restored.paramVariants).toEqual({
      category: {
        variants: { en: 'web-development', ru: 'veb-razrabotka' },
      },
    })
    expect(restored.queryVariants).toEqual({
      focus: {
        variants: { en: 'frontend', ru: 'frontend-ru' },
      },
    })
    expect(restored.localizePath('/services/:category', 'ru', {
      params: { category: 'web-development' },
      query: { focus: 'frontend' },
    })).toBe('/ru/uslugi/veb-razrabotka?focus=frontend-ru')
    expect(restored.alternateUrls).toEqual([
      { locale: 'en', url: '/en/services/web-development?focus=frontend' },
      { locale: 'ru', url: '/ru/uslugi/veb-razrabotka?focus=frontend-ru' },
    ])
  })
})
