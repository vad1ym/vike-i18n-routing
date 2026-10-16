import { describe, expect, it } from 'vitest'
import { onBeforeRoute } from '../lib/vike/onBeforeRoute'
import { headersResponse } from '../lib/vike/headersResponse'
import { createI18nRouter } from '../lib/core/router'
import { useI18nRoute } from '../lib/core/useI18nRoute'
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

describe('onBeforeRoute on client hydration', () => {
  it('keeps the runtime variants of the server-provided i18nRoute', () => {
    const url = '/en/services/web-development?focus=frontend'
    const serverContext = makePageContext(url, config, { headers: { host: 'site.com' } })
    const serverRoute = createI18nRouter(url, serverContext as any)
    expect(serverRoute.paramVariants).toEqual({})

    // +data registers variants on the server; the resulting i18nRoute is passed to the client
    const { setRouteParamVariants, setRouteQueryVariants } = useI18nRoute({ ...serverContext, i18nRoute: serverRoute })
    setRouteParamVariants('category', { en: 'web-development', ru: 'veb-razrabotka' })
    setRouteQueryVariants('focus', { en: 'frontend', ru: 'frontend-ru' })

    // The client re-runs onBeforeRoute with the serialized i18nRoute already on pageContext
    const hydrated = onBeforeRoute({
      ...makePageContext(url, config),
      isClientSide: true,
      i18nRoute: JSON.parse(JSON.stringify(serverRoute)),
    } as any)
    const i18nRoute = hydrated.pageContext.i18nRoute!

    expect(i18nRoute.paramVariants).toEqual({
      category: { variants: { en: 'web-development', ru: 'veb-razrabotka' } },
    })
    expect(i18nRoute.queryVariants).toEqual({
      focus: { variants: { en: 'frontend', ru: 'frontend-ru' } },
    })
    expect(i18nRoute.alternateUrls).toEqual([
      { locale: 'en', url: '/en/services/web-development?focus=frontend' },
      { locale: 'ru', url: '/ru/uslugi/veb-razrabotka?focus=frontend-ru' },
    ])
    expect(useI18nRoute({ ...makePageContext(url, config), i18nRoute }).localizePath('/services/:category', 'ru', {
      params: { category: 'web-development' },
      query: { focus: 'frontend' },
    })).toBe('/ru/uslugi/veb-razrabotka?focus=frontend-ru')
  })

  it('routes without variants when pageContext has no i18nRoute (client-side navigation)', () => {
    const result = onBeforeRoute({ ...makePageContext('/en/services/web-development', config), isClientSide: true } as any)
    expect(result.pageContext.i18nRoute!.paramVariants).toEqual({})
  })
})
