import { afterEach, describe, expect, it, vi } from 'vitest'
import { onBeforeRender } from '../lib/vike/onBeforeRender'
import { onBeforeRoute } from '../lib/vike/onBeforeRoute'
import { onHydrationEnd } from '../lib/vike/onHydrationEnd'
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

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('onBeforeRender', () => {
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

  it('appends locale cookie and passes runtime variants to client', () => {
    const append = vi.fn()
    const result = onBeforeRender({
      config: { i18n: config },
      locale: 'ru',
      headersResponse: { append },
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

    expect(append).toHaveBeenCalledWith(
      'Set-Cookie',
      'locale=ru; Path=/; SameSite=Lax; HttpOnly',
    )
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

  it('does not append cookie when localeCookie is disabled', () => {
    const append = vi.fn()

    onBeforeRender({
      config: {
        i18n: {
          ...config,
          localeCookie: false,
        },
      },
      locale: 'ru',
      headersResponse: { append },
      i18nRoute: {
        paramVariants: {},
        queryVariants: {},
      },
    } as any)

    expect(append).not.toHaveBeenCalled()
  })
})

describe('onHydrationEnd', () => {
  it('removes locale query param and preserves other params and hash', () => {
    const replaceState = vi.fn()

    vi.stubGlobal('location', {
      href: 'https://site.com/about?locale=ru&page=2#team',
    })
    vi.stubGlobal('history', { replaceState })

    onHydrationEnd()

    expect(replaceState).toHaveBeenCalledWith(null, '', '/about?page=2#team')
  })

  it('does nothing when locale query param is absent', () => {
    const replaceState = vi.fn()

    vi.stubGlobal('location', {
      href: 'https://site.com/about?page=2#team',
    })
    vi.stubGlobal('history', { replaceState })

    onHydrationEnd()

    expect(replaceState).not.toHaveBeenCalled()
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
