import { describe, it, expect } from 'vitest'
import { createI18nRouter } from '../lib/core/router'
import { createPageContext } from '../lib/core/pageContext'
import { useI18nRoute } from '../lib/core/useI18nRoute'
import type { I18nConfig } from '../lib/core/types'

function makeRouter(url: string, config: I18nConfig) {
  const pageContext = createPageContext(url, { config: { i18n: config } })
  const i18nRoute = createI18nRouter(new URL(url, 'http://localhost').pathname, pageContext)
  return { i18nRoute, ...useI18nRoute({ ...pageContext, i18nRoute }) }
}

const base: I18nConfig = {
  defaultLocale: 'en',
  locales: ['en', 'ru'],
  routes: {
    '/': { en: '/', ru: '/' },
    '/about': { en: '/about', ru: '/o-nas' },
  },
}

// ─── default ('never') ───────────────────────────────────────────────────────

describe("trailingSlash: 'never' (default)", () => {
  it('does not redirect clean URLs', () => {
    const { i18nRoute } = makeRouter('/en/about', base)
    expect(i18nRoute.routeConfig.redirectTo).toBeUndefined()
  })

  it('redirects trailing-slash URL to clean URL with 301', () => {
    const { i18nRoute } = makeRouter('/en/about/', base)
    expect(i18nRoute.routeConfig.redirectTo).toBe('/en/about')
    expect(i18nRoute.routeConfig.redirectStatus).toBe(301)
  })

  it('does not redirect root / due to trailing slash', () => {
    // Root redirects to /en (locale prefix) — that is expected routing behavior, not trailing slash
    const { i18nRoute } = makeRouter('/', base)
    expect(i18nRoute.routeConfig.redirectTo).toBe('/en')
  })

  it('localizePath produces URLs without trailing slash', () => {
    const { localizePath } = makeRouter('/en/about', base)
    expect(localizePath('/about')).toBe('/en/about')
    expect(localizePath('/about', 'ru')).toBe('/ru/o-nas')
  })
})

// ─── 'always' ────────────────────────────────────────────────────────────────

describe("trailingSlash: 'always'", () => {
  const config: I18nConfig = { ...base, trailingSlash: 'always' }

  it('redirects clean URL to trailing-slash URL with 301', () => {
    const { i18nRoute } = makeRouter('/en/about', config)
    expect(i18nRoute.routeConfig.redirectTo).toBe('/en/about/')
    expect(i18nRoute.routeConfig.redirectStatus).toBe(301)
  })

  it('does not redirect trailing-slash URL', () => {
    const { i18nRoute } = makeRouter('/en/about/', config)
    expect(i18nRoute.routeConfig.redirectTo).toBeUndefined()
  })

  it('does not redirect root / due to trailing slash', () => {
    // Root redirects to /en/ (locale prefix + always slash) — expected routing behavior
    const { i18nRoute } = makeRouter('/', config)
    expect(i18nRoute.routeConfig.redirectTo).toBe('/en/')
  })

  it('localizePath produces URLs with trailing slash', () => {
    const { localizePath } = makeRouter('/en/about/', config)
    expect(localizePath('/about')).toBe('/en/about/')
    expect(localizePath('/about', 'ru')).toBe('/ru/o-nas/')
  })

  it('alternateUrls have trailing slashes', () => {
    const { i18nRoute } = makeRouter('/en/about/', config)
    for (const alt of i18nRoute.routeConfig.alternateUrls) {
      expect(alt.url).toMatch(/\/$/)
    }
  })
})

// ─── 'preserve' ──────────────────────────────────────────────────────────────

describe("trailingSlash: 'preserve'", () => {
  const config: I18nConfig = { ...base, trailingSlash: 'preserve' }

  it('does not redirect trailing-slash URL', () => {
    const { i18nRoute } = makeRouter('/en/about/', config)
    expect(i18nRoute.routeConfig.redirectTo).toBeUndefined()
  })

  it('does not redirect clean URL', () => {
    const { i18nRoute } = makeRouter('/en/about', config)
    expect(i18nRoute.routeConfig.redirectTo).toBeUndefined()
  })
})

// ─── trailingSlashRedirect ───────────────────────────────────────────────────

describe('trailingSlashRedirect', () => {
  it('uses custom redirect status code', () => {
    const config: I18nConfig = { ...base, trailingSlash: 'never', trailingSlashRedirect: 302 }
    const { i18nRoute } = makeRouter('/en/about/', config)
    expect(i18nRoute.routeConfig.redirectTo).toBe('/en/about')
    expect(i18nRoute.routeConfig.redirectStatus).toBe(302)
  })

  it('disables redirect when false', () => {
    const config: I18nConfig = { ...base, trailingSlash: 'never', trailingSlashRedirect: false }
    const { i18nRoute } = makeRouter('/en/about/', config)
    expect(i18nRoute.routeConfig.redirectTo).toBeUndefined()
  })
})

// ─── per-domain override ─────────────────────────────────────────────────────

describe('per-domain trailingSlash override', () => {
  const config: I18nConfig = {
    ...base,
    trailingSlash: 'never',
    domains: {
      'site.fr': { defaultLocale: 'en', locales: ['en'], trailingSlash: 'always' },
    },
  }

  it('global domain uses never', () => {
    const { i18nRoute } = makeRouter('/en/about/', config)
    expect(i18nRoute.routeConfig.redirectTo).toBe('/en/about')
  })
})

// ─── per-call override in localizePath ───────────────────────────────────────

describe('per-call trailingSlash in localizePath', () => {
  it('per-call always overrides global never', () => {
    const { localizePath } = makeRouter('/en/about', base)
    expect(localizePath('/about', 'en', { trailingSlash: 'always' })).toBe('/en/about/')
  })

  it('per-call never overrides global always', () => {
    const config: I18nConfig = { ...base, trailingSlash: 'always' }
    const { localizePath } = makeRouter('/en/about/', config)
    expect(localizePath('/about', 'en', { trailingSlash: 'never' })).toBe('/en/about')
  })

  it('per-call preserve keeps no slash when route has none', () => {
    const config: I18nConfig = { ...base, trailingSlash: 'always' }
    const { localizePath } = makeRouter('/en/about/', config)
    expect(localizePath('/about', 'en', { trailingSlash: 'preserve' })).toBe('/en/about')
  })
})
