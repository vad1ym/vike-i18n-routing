import { describe, it, expect } from 'vitest'
import { createI18nRouter } from '../lib/core/router'
import { createPageContext } from '../lib/core/pageContext'
import type { I18nConfig } from '../lib/core/types'

function makeRouter(url: string, config: I18nConfig) {
  const pageContext = createPageContext(url, { config: { i18n: config } })
  return createI18nRouter(new URL(url, 'http://localhost').pathname, pageContext)
}

const base: I18nConfig = {
  defaultLocale: 'en',
  locales: ['en', 'ru'],
  routes: {
    '/': { en: '/', ru: '/' },
    '/about': { en: '/about', ru: '/o-nas' },
    '/blog/:slug': { en: '/blog/:slug', ru: '/blog/:slug' },
  },
}

// ─── Simple string alias ────────────────────────────────────────────────────

describe('simple string alias', () => {
  const config: I18nConfig = {
    ...base,
    aliases: {
      '/company': '/about',
    },
  }

  it('sets renderTo when visiting alias URL', () => {
    const route = makeRouter('/en/company', config)
    expect(route.routeConfig.renderTo).toBeDefined()
    expect(route.routeConfig.redirectTo).toBeUndefined()
  })

  it('renderTo points to the target route URL', () => {
    const route = makeRouter('/en/company', config)
    expect(route.routeConfig.renderTo).toBe('/en/about')
  })

  it('renders target page for Russian alias', () => {
    // Russian localized path of /about is /o-nas, not /company — no alias for ru
    // but /ru/company should still resolve via alias
    const route = makeRouter('/ru/company', config)
    expect(route.routeConfig.renderTo).toBeDefined()
    expect(route.routeConfig.renderTo).toBe('/ru/o-nas')
  })

  it('does not set renderTo for direct route access', () => {
    const route = makeRouter('/en/about', config)
    expect(route.routeConfig.renderTo).toBeUndefined()
  })

  it('i18nUrl points to target route key', () => {
    const route = makeRouter('/en/company', config)
    expect(route.routeConfig.i18nUrl).toBe('/about')
  })
})

// ─── Localized alias ────────────────────────────────────────────────────────

describe('localized alias', () => {
  const config: I18nConfig = {
    ...base,
    aliases: {
      '/spain/about': {
        target: '/about',
        en: '/spain/about',
        ru: '/spain/o-nas',
      },
    },
  }

  it('matches English localized alias path', () => {
    const route = makeRouter('/en/spain/about', config)
    expect(route.routeConfig.renderTo).toBeDefined()
    expect(route.routeConfig.i18nUrl).toBe('/about')
  })

  it('matches Russian localized alias path', () => {
    const route = makeRouter('/ru/spain/o-nas', config)
    expect(route.routeConfig.renderTo).toBeDefined()
    expect(route.routeConfig.i18nUrl).toBe('/about')
  })

  it('alternateUrls use alias paths not target paths', () => {
    const route = makeRouter('/en/spain/about', config)
    const enAlt = route.routeConfig.alternateUrls.find((a) => a.locale === 'en')
    const ruAlt = route.routeConfig.alternateUrls.find((a) => a.locale === 'ru')
    expect(enAlt?.url).toBe('/en/spain/about')
    expect(ruAlt?.url).toBe('/ru/spain/o-nas')
  })
})

// ─── Parametric alias ───────────────────────────────────────────────────────

describe('parametric alias', () => {
  const config: I18nConfig = {
    ...base,
    aliases: {
      '/blog/:country/:slug': '/blog/:slug',
    },
  }

  it('matches parametric alias and extracts params', () => {
    const route = makeRouter('/en/blog/spain/my-post', config)
    expect(route.routeConfig.renderTo).toBeDefined()
    expect(route.routeConfig.i18nUrl).toBe('/blog/:slug')
  })

  it('merges alias params with route params', () => {
    const route = makeRouter('/en/blog/spain/my-post', config)
    expect(route.routeConfig.i18nUrlParams).toMatchObject({
      country: 'spain',
      slug: 'my-post',
    })
  })
})

// ─── Wildcard alias ─────────────────────────────────────────────────────────

describe('wildcard alias', () => {
  const config: I18nConfig = {
    defaultLocale: 'en',
    locales: ['en', 'ru'],
    prefixDefaultLocale: false,
    routes: {
      '/blog': { en: '/blog', ru: '/blog' },
      '/blog/:slug': { en: '/blog/:slug', ru: '/blog/:slug' },
    },
    aliases: {
      '/blog/:country/*path': '/blog/*path',
    },
  }

  it('resolves wildcard alias to target route', () => {
    const route = makeRouter('/blog/spain/my-post', config)
    expect(route.routeConfig.renderTo).toBeDefined()
    expect(route.routeConfig.i18nUrl).toBe('/blog/:slug')
    expect(route.routeConfig.renderTo).toBe('/blog/my-post')
  })

  it('does not set renderTo when re-rendered at rewrite target (no infinite loop)', () => {
    // Simulates the second onBeforeRoute call vike makes when processing throw render()
    // In this cycle, _urlRewrite is set to the target so urlOriginal is bypassed
    const route = makeRouter('/blog/my-post', config)
    expect(route.routeConfig.renderTo).toBeUndefined()
  })
})

// ─── Per-domain aliases ─────────────────────────────────────────────────────

describe('per-domain aliases', () => {
  const config: I18nConfig = {
    ...base,
    domains: {
      'site.es': {
        defaultLocale: 'en',
        locales: ['en'],
        aliases: {
          '/empresa': '/about',
        },
      },
    },
  }

  it('domain alias does not apply on global domain', () => {
    const route = makeRouter('/en/empresa', config)
    // No alias configured globally — should not resolve
    expect(route.routeConfig.renderTo).toBeUndefined()
  })
})

// ─── No alias when route is found directly ─────────────────────────────────

describe('alias fallthrough', () => {
  const config: I18nConfig = {
    ...base,
    aliases: {
      '/company': '/about',
    },
  }

  it('does not use alias when real route matches', () => {
    const route = makeRouter('/en/about', config)
    expect(route.routeConfig.renderTo).toBeUndefined()
  })

  it('does not use alias for localized route path', () => {
    const route = makeRouter('/ru/o-nas', config)
    expect(route.routeConfig.renderTo).toBeUndefined()
  })
})
