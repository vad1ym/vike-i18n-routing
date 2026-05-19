import { describe, it, expect } from 'vitest'
import { onBeforeRoute } from '../lib/vike/onBeforeRoute'
import { makePageContext, resolveRenderRedirect } from './helpers/pageContext'
import type { I18nConfig } from '../lib/core/types'

const arrayConfig: I18nConfig = {
  defaultLocale: 'en',
  locales: ['en', 'ru'],
  routes: {
    '/': { en: '/', ru: '/' },
    '/about': { en: '/about', ru: '/o-nas' },
  },
}

const objectConfig: I18nConfig = {
  defaultLocale: 'en',
  locales: {
    en: { urlPrefix: 'en', meta: { currency: 'USD', region: 'us' } },
    ru: { urlPrefix: 'ru', meta: { currency: 'UAH', region: 'ua' } },
  },
  routes: arrayConfig.routes,
}

const noDefaultPrefixConfig: I18nConfig = {
  ...arrayConfig,
  prefixDefaultLocale: false,
  localeCookie: 'locale',
}

describe('locales — array form', () => {
  it('resolves locale from url prefix', () => {
    const result = onBeforeRoute(makePageContext('/ru/o-nas', arrayConfig) as any)
    const i18nRoute = result.pageContext.i18nRoute!
    expect(result.pageContext.locale).toBe('ru')
    expect(i18nRoute.localeConfig.defaultLocale).toBe('en')
    expect(i18nRoute.localeConfig.currentLocale).toBe('ru')
  })

  it('redirects unprefixed url to default locale', () => {
    expect(resolveRenderRedirect(makePageContext('/', arrayConfig))).toBe('/en')
  })

  it('throws for missing i18n config', () => {
    const ctx = { urlOriginal: '/', config: {} }
    expect(() => onBeforeRoute(ctx as any)).toThrow('[vike-i18n] Missing config.i18n')
  })
})

describe('locales — object form', () => {
  it('resolves locale same as array form', () => {
    const arrayResult = onBeforeRoute(makePageContext('/ru/o-nas', arrayConfig) as any)
    const objectResult = onBeforeRoute(makePageContext('/ru/o-nas', objectConfig) as any)
    expect(arrayResult.pageContext.locale).toBe(objectResult.pageContext.locale)
    expect(arrayResult.pageContext.i18nRoute!.routeConfig.canonicalUrl).toBe(
      objectResult.pageContext.i18nRoute!.routeConfig.canonicalUrl,
    )
  })

  it('exposes locale meta on localeConfig and locale entries', () => {
    const result = onBeforeRoute(makePageContext('/ru/o-nas', objectConfig) as any)

    expect(result.pageContext.i18nRoute!.localeConfig.currentLocaleMeta).toEqual({
      currency: 'UAH',
      region: 'ua',
    })
    expect(result.pageContext.i18nRoute!.localeConfig.locales.ru.meta).toEqual({
      currency: 'UAH',
      region: 'ua',
    })
  })

  it('redirects same as array form', () => {
    const arrayRedirect = resolveRenderRedirect(makePageContext('/about', arrayConfig))
    const objectRedirect = resolveRenderRedirect(makePageContext('/about', objectConfig))
    expect(arrayRedirect).toBe(objectRedirect)
  })
})

describe('locales — default locale without prefix', () => {
  it('redirects explicit default locale prefix to unprefixed url with locale', () => {
    expect(
      resolveRenderRedirect(
        makePageContext('/en', noDefaultPrefixConfig, {
          headers: { cookie: 'locale=ru' },
        }),
      ),
    ).toBe('/?locale=en')
  })

  it('prefers locale query over stale locale cookie', () => {
    const result = onBeforeRoute(
      makePageContext('/?locale=en', noDefaultPrefixConfig, {
        headers: { cookie: 'locale=ru' },
      }) as any,
    )

    expect(result.pageContext.locale).toBe('en')
    expect(result.pageContext.i18nRoute!.localeConfig.currentLocale).toBe('en')
  })
})
