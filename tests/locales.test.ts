import { describe, it, expect } from 'vitest'
import { onBeforeRoute } from '../lib/vike/onBeforeRoute'
import { makePageContext, getRedirectUrl } from './helpers/pageContext'
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
    en: { urlPrefix: 'en' },
    ru: { urlPrefix: 'ru' },
  },
  routes: arrayConfig.routes,
}

describe('locales — array form', () => {
  it('resolves locale from url prefix', () => {
    const result = onBeforeRoute(makePageContext('/ru/o-nas', arrayConfig) as any)
    expect(result.pageContext.locale).toBe('ru')
  })

  it('redirects unprefixed url to default locale', () => {
    try {
      onBeforeRoute(makePageContext('/', arrayConfig) as any)
    } catch (e) {
      expect(getRedirectUrl(e)).toBe('/en')
    }
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
    expect(arrayResult.pageContext.canonical).toBe(objectResult.pageContext.canonical)
  })

  it('redirects same as array form', () => {
    let arrayRedirect: string | null = null
    let objectRedirect: string | null = null

    try { onBeforeRoute(makePageContext('/about', arrayConfig) as any) } catch (e) {
      arrayRedirect = getRedirectUrl(e)
    }
    try { onBeforeRoute(makePageContext('/about', objectConfig) as any) } catch (e) {
      objectRedirect = getRedirectUrl(e)
    }

    expect(arrayRedirect).toBe(objectRedirect)
  })
})
