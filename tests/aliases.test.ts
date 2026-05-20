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

  it('routes alias URL to target page via urlLogical (no renderTo)', () => {
    const route = makeRouter('/en/company', config)
    expect(route.routeConfig.renderTo).toBeUndefined()
    expect(route.routeConfig.redirectTo).toBeUndefined()
    // canonicalUrl points to target — vike uses this as urlLogical
    expect(route.routeConfig.canonicalUrl).toBe('/about')
  })

  it('resolves target for Russian alias', () => {
    const route = makeRouter('/ru/company', config)
    expect(route.routeConfig.renderTo).toBeUndefined()
    expect(route.routeConfig.canonicalUrl).toBe('/about')
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
    expect(route.routeConfig.renderTo).toBeUndefined()
    expect(route.routeConfig.i18nUrl).toBe('/about')
    expect(route.routeConfig.canonicalUrl).toBe('/about')
  })

  it('matches Russian localized alias path', () => {
    const route = makeRouter('/ru/spain/o-nas', config)
    expect(route.routeConfig.renderTo).toBeUndefined()
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

  it('matches parametric alias and routes to target page', () => {
    const route = makeRouter('/en/blog/spain/my-post', config)
    expect(route.routeConfig.renderTo).toBeUndefined()
    expect(route.routeConfig.i18nUrl).toBe('/blog/:slug')
    expect(route.routeConfig.canonicalUrl).toBe('/blog/my-post')
  })

  it('merges alias params with route params (including alias-only params)', () => {
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
    expect(route.routeConfig.renderTo).toBeUndefined()
    expect(route.routeConfig.i18nUrl).toBe('/blog/:slug')
    expect(route.routeConfig.canonicalUrl).toBe('/blog/my-post')
  })

  it('includes alias-only params (country) in i18nUrlParams', () => {
    const route = makeRouter('/blog/spain/my-post', config)
    expect(route.routeConfig.i18nUrlParams).toMatchObject({
      country: 'spain',
      slug: 'my-post',
    })
  })
})

// ─── Wildcard alias with localized routes ────────────────────────────────────

describe('wildcard alias with localized routes', () => {
  const config: I18nConfig = {
    defaultLocale: 'en',
    locales: ['en', 'ru'],
    prefixDefaultLocale: false,
    routes: {
      '/medicines': { en: '/medicines', ru: '/lekarstva' },
      '/medicines/:slug': { en: '/medicines/:slug', ru: '/lekarstva/:slug' },
    },
    aliases: {
      '/medicines/:country/*path': '/medicines/*path',
    },
  }

  it('routes /medicines/asd/dsa to /medicines/:slug with country in params', () => {
    const route = makeRouter('/medicines/asd/dsa', config)
    expect(route.routeConfig.renderTo).toBeUndefined()
    expect(route.routeConfig.i18nUrl).toBe('/medicines/:slug')
    expect(route.routeConfig.canonicalUrl).toBe('/medicines/dsa')
    expect(route.routeConfig.i18nUrlParams).toMatchObject({
      country: 'asd',
      slug: 'dsa',
    })
  })

  it('direct /medicines/dsa access is not treated as alias', () => {
    const route = makeRouter('/medicines/dsa', config)
    expect(route.routeConfig.renderTo).toBeUndefined()
    expect(route.routeConfig.i18nUrl).toBe('/medicines/:slug')
    expect(route.routeConfig.i18nUrlParams).toEqual({ slug: 'dsa' })
  })
})

// ─── Alias chaining ──────────────────────────────────────────────────────────

describe('alias chaining', () => {
  const config: I18nConfig = {
    defaultLocale: 'en',
    locales: ['en', 'ru'],
    prefixDefaultLocale: false,
    routes: {
      '/medicines': { en: '/medicines', ru: '/lekarstva' },
      '/medicines/:slug': { en: '/medicines/:slug', ru: '/lekarstva/:slug' },
    },
    aliases: {
      '/medicines/p/:page': '/medicines',
      '/medicines/:country/*path': '/medicines/*path',
    },
  }

  it('/medicines/ukraine/p/1 chains through country alias then page alias to /medicines', () => {
    const route = makeRouter('/medicines/ukraine/p/1', config)
    expect(route.routeConfig.renderTo).toBeUndefined()
    expect(route.routeConfig.i18nUrl).toBe('/medicines')
    expect(route.routeConfig.canonicalUrl).toBe('/medicines')
  })

  it('includes all params from the chain', () => {
    const route = makeRouter('/medicines/ukraine/p/1', config)
    expect(route.routeConfig.i18nUrlParams).toMatchObject({ country: 'ukraine', page: '1' })
  })

  it('/medicines/ukraine/aspirin still routes to /medicines/:slug', () => {
    const route = makeRouter('/medicines/ukraine/aspirin', config)
    expect(route.routeConfig.i18nUrl).toBe('/medicines/:slug')
    expect(route.routeConfig.canonicalUrl).toBe('/medicines/aspirin')
    expect(route.routeConfig.i18nUrlParams).toMatchObject({ country: 'ukraine', slug: 'aspirin' })
  })
})

// ─── Localized alias with parametric target ─────────────────────────────────

describe('localized alias with parametric target', () => {
  const config: I18nConfig = {
    defaultLocale: 'en',
    locales: ['en', 'ru'],
    prefixDefaultLocale: false,
    routes: {
      '/medicines': { en: '/medicines', ru: '/lekarstva' },
      '/medicines/:slug': { en: '/medicines/:slug', ru: '/lekarstva/:slug' },
    },
    aliases: {
      // target uses same param name as the alias — it's a path template filled from alias params
      '/medicines/ingredient/:ingredient': {
        target: '/medicines',
        en: '/medicines/ingredient/:ingredient',
        ru: '/lekarstva/ingredient/:ingredient',
      },
    },
  }

  it('routes to /medicines regardless of ingredient param', () => {
    const route = makeRouter('/medicines/ingredient/aspirin', config)
    expect(route.routeConfig.i18nUrl).toBe('/medicines')
    expect(route.routeConfig.canonicalUrl).toBe('/medicines')
    expect(route.routeConfig.i18nUrlParams).toMatchObject({ ingredient: 'aspirin' })
  })

  it('ru locale: routes lekarstva/ingredient/:ingredient to /medicines', () => {
    const route = makeRouter('/ru/lekarstva/ingredient/aspirin', config)
    expect(route.routeConfig.i18nUrl).toBe('/medicines')
    expect(route.routeConfig.canonicalUrl).toBe('/medicines')
  })
})

// ─── Alias chaining with localized alias ────────────────────────────────────

describe('alias chaining — localized target alias', () => {
  const config: I18nConfig = {
    defaultLocale: 'en',
    locales: ['en', 'ru'],
    prefixDefaultLocale: false,
    routes: {
      '/medicines': { en: '/medicines', ru: '/lekarstva' },
      '/medicines/:slug': { en: '/medicines/:slug', ru: '/lekarstva/:slug' },
    },
    aliases: {
      '/medicines/manufacturer/:manufacturer': { target: '/medicines', en: '/medicines', ru: '/lekarstva' },
      '/medicines/:country/*path': '/medicines/*path',
    },
  }

  it('/medicines/ukraine/manufacturer/123 chains to /medicines with correct params', () => {
    const route = makeRouter('/medicines/ukraine/manufacturer/123', config)
    expect(route.routeConfig.i18nUrl).toBe('/medicines')
    expect(route.routeConfig.canonicalUrl).toBe('/medicines')
    expect(route.routeConfig.i18nUrlParams).toMatchObject({ country: 'ukraine', manufacturer: '123' })
  })

  it('/medicines/ukraine/aspirin still routes to /medicines/:slug', () => {
    const route = makeRouter('/medicines/ukraine/aspirin', config)
    expect(route.routeConfig.i18nUrl).toBe('/medicines/:slug')
    expect(route.routeConfig.i18nUrlParams).toMatchObject({ country: 'ukraine', slug: 'aspirin' })
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
    expect(route.routeConfig.canonicalUrl).not.toBe('/about')
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
