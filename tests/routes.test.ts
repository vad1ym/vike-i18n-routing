import { afterEach, describe, it, expect, vi } from 'vitest'
import { onBeforeRoute } from '../lib/vike/onBeforeRoute'
import { makePageContext, resolveRenderRedirect, createTestRouter } from './helpers/pageContext'
import { baseConfig } from './helpers/config'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('routes — translated paths', () => {
  it('resolves ru translated path to logical url', () => {
    const result = onBeforeRoute(makePageContext('/ru/o-nas', baseConfig) as any)
    const i18nRoute = result.pageContext.i18nRoute!
    expect(result.pageContext.locale).toBe('ru')
    expect(i18nRoute.localeConfig.currentLocale).toBe('ru')
    expect(i18nRoute.routeConfig).toMatchObject({
      requestUrl: '/ru/o-nas',
      defaultLocaleUrl: '/en/about',
      currentLocaleUrl: '/ru/o-nas',
      canonicalUrl: '/about',
      i18nUrl: '/about',
      i18nUrlParams: {},
    })
  })

  it('resolves en path to logical url', () => {
    const result = onBeforeRoute(makePageContext('/en/about', baseConfig) as any)
    expect(result.pageContext.locale).toBe('en')
    expect(result.pageContext.i18nRoute!.routeConfig.canonicalUrl).toBe('/about')
  })

  it('resolves root path correctly', () => {
    const result = onBeforeRoute(makePageContext('/ru', baseConfig) as any)
    expect(result.pageContext.locale).toBe('ru')
    expect(result.pageContext.i18nRoute!.routeConfig.canonicalUrl).toBe('/')
  })

  it('falls back to path as logical url when no route match', () => {
    const result = onBeforeRoute(makePageContext('/en/unknown-page', baseConfig) as any)
    expect(result.pageContext.i18nRoute!.routeConfig.canonicalUrl).toBe('/unknown-page')
  })

  it('stores informational domainConfig when no domain override is matched', () => {
    const result = onBeforeRoute(makePageContext('/en/about', baseConfig) as any)
    expect(result.pageContext.i18nRoute!.domainConfig).toMatchObject({ domain: undefined })
  })
})

describe('routes — redirects', () => {
  it('redirects / to /en', () => {
    expect(resolveRenderRedirect(makePageContext('/', baseConfig))).toBe('/en')
  })

  it('redirects /about to /en/about', () => {
    expect(resolveRenderRedirect(makePageContext('/about', baseConfig))).toBe('/en/about')
  })

  it('redirects /en/o-nas to /en/about (wrong locale translation used)', () => {
    expect(resolveRenderRedirect(makePageContext('/en/o-nas', baseConfig))).toBe('/en/about')
  })

  it('redirects /ru/about to /ru/o-nas (wrong locale translation used)', () => {
    expect(resolveRenderRedirect(makePageContext('/ru/about', baseConfig))).toBe('/ru/o-nas')
  })
})

describe('routes — integration (router + useI18nRoute)', () => {
  it('resolves canonicalUrl, localizes path, and builds alternateUrls', () => {
    const route = createTestRouter('/en/about', baseConfig)

    expect(route.routeConfig.canonicalUrl).toBe('/about')
    expect(route.localizePath('/about', 'ru')).toBe('/ru/o-nas')
    expect(route.routeConfig.alternateUrls).toEqual([
      { locale: 'en', url: '/en/about' },
      { locale: 'ru', url: '/ru/o-nas' },
    ])
  })

  it('builds localized URLs through route descriptor helper', () => {
    const route = createTestRouter('/en/about', baseConfig)
    const about = route.route('/about')

    expect(about.key).toBe('/about')
    expect(about.to('ru')).toBe('/ru/o-nas')
    expect(route.localizePath(about, 'ru')).toBe('/ru/o-nas')
  })

  it('uses descriptor for repeated static localization without changing output', () => {
    const route = createTestRouter('/en/about', baseConfig)
    const about = route.route('/about')

    expect(about.to('en')).toBe('/en/about')
    expect(about.to('ru')).toBe('/ru/o-nas')
    expect(route.localizePath(about, 'en')).toBe('/en/about')
  })

  it('resolves route keys from localized, canonical, and absolute URLs', () => {
    const route = createTestRouter('/en/about', baseConfig)

    expect(route.resolveRouteKey('/ru/o-nas')).toBe('/about')
    expect(route.resolveRouteKey('/en/about')).toBe('/about')
    expect(route.resolveRouteKey('https://site.com/ru/o-nas')).toBe('/about')
  })

  it('returns null for unknown URLs', () => {
    const route = createTestRouter('/en/about', baseConfig)

    expect(route.resolveRouteKey('/unknown')).toBeNull()
  })

  it('keeps absolute input as absolute by default', () => {
    const route = createTestRouter('/en/about', {
      ...baseConfig,
      baseUrl: 'https://site.com',
    })

    expect(route.localizePath('https://site.com/en/about', 'ru')).toBe('https://site.com/ru/o-nas')
  })

  it('can force absolute output from a path input', () => {
    const route = createTestRouter('/en/about', {
      ...baseConfig,
      baseUrl: 'https://site.com',
    })

    expect(route.localizePath('/about', 'ru', { absolute: true })).toBe('https://site.com/ru/o-nas')
    expect(route.route('/about').to('ru', { absolute: true })).toBe('https://site.com/ru/o-nas')
  })

  it('can force path-only output from an absolute input', () => {
    const route = createTestRouter('/en/about', {
      ...baseConfig,
      baseUrl: 'https://site.com',
    })

    expect(route.localizePath('https://site.com/en/about', 'ru', { absolute: false })).toBe('/ru/o-nas')
  })

  it('preserves unknown absolute origins and localizes only the path', () => {
    const route = createTestRouter('/en/about', baseConfig)

    expect(route.localizePath('https://external.com/en/about', 'ru')).toBe('https://external.com/ru/o-nas')
  })

  it('warns and falls back to path-only when absolute output is requested without baseUrl', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const route = createTestRouter('/en/about', baseConfig)

    expect(route.localizePath('/about', 'ru', { absolute: true })).toBe('/ru/o-nas')
    expect(warn).toHaveBeenCalledWith(
      '[vike-i18n] localizePath(..., { absolute: true }) requires i18n.baseUrl or domains[*].baseUrl. Returning a path-only URL.',
    )
  })
})
