import { describe, expect, it } from 'vitest'
import { createI18nRouter } from '../lib/core/router'
import { createPageContext } from '../lib/core/pageContext'
import type { I18nConfig } from '../lib/core/types'

const config: I18nConfig = {
  defaultLocale: 'en',
  locales: ['en', 'ru'],
  prefixDefaultLocale: false,
  routes: {
    '/about': { en: '/about', ru: '/o-nas' },
    '/services/:category': { en: '/services/:category', ru: '/uslugi/:category' },
  },
}

function route(url: string, options?: { headers?: Record<string, string> }) {
  const pageContext = createPageContext(url, { config: { i18n: config }, headers: options?.headers })
  return createI18nRouter(url, pageContext)
}

// Vike fetches `<page-url>/index.pageContext.json` on client-side navigation. The request must
// resolve exactly like the page URL and never redirect to the page URL itself.
describe('.pageContext.json requests', () => {
  it('does not redirect a canonical page URL to itself', () => {
    const i18nRoute = route('/about/index.pageContext.json')
    expect(i18nRoute.redirectTo).toBeUndefined()
    expect(i18nRoute.routeKey).toBe('/about')
    expect(i18nRoute.logicalUrl).toBe('/about')
    expect(i18nRoute.currentLocaleUrl).toBe('/about')
  })

  it('does not redirect a localized dynamic route with a query string', () => {
    const i18nRoute = route('/ru/uslugi/web-development/index.pageContext.json?focus=frontend')
    expect(i18nRoute.redirectTo).toBeUndefined()
    expect(i18nRoute.locale).toBe('ru')
    expect(i18nRoute.params).toEqual({ category: 'web-development' })
    expect(i18nRoute.currentLocaleUrl).toBe('/ru/uslugi/web-development?focus=frontend')
  })

  it('does not redirect the root page', () => {
    const i18nRoute = route('/ru/index.pageContext.json')
    expect(i18nRoute.redirectTo).toBeUndefined()
    expect(i18nRoute.currentLocaleUrl).toBe('/ru')
  })

  it('still redirects when the page URL itself needs a redirect', () => {
    const i18nRoute = route('/about/index.pageContext.json?lang=ru')
    expect(i18nRoute.redirectTo).toBe('/ru/o-nas')
  })

  it("does not apply trailing slash redirects to a .pageContext.json request", () => {
    const pageContext = createPageContext('/about/index.pageContext.json', {
      config: { i18n: { ...config, trailingSlash: 'always' } },
    })
    const i18nRoute = createI18nRouter('/about/index.pageContext.json', pageContext)
    expect(i18nRoute.redirectTo).toBeUndefined()
  })
})
