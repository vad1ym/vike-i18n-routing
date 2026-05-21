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
    expect(route.renderTo).toBeUndefined()
    expect(route.redirectTo).toBeUndefined()
    // canonicalUrl points to target — vike uses this as urlLogical
    expect(route.logicalUrl).toBe('/about')
  })

  it('resolves target for Russian alias', () => {
    const route = makeRouter('/ru/company', config)
    expect(route.renderTo).toBeUndefined()
    expect(route.logicalUrl).toBe('/about')
  })

  it('does not set renderTo for direct route access', () => {
    const route = makeRouter('/en/about', config)
    expect(route.renderTo).toBeUndefined()
  })

  it('i18nUrl points to target route key', () => {
    const route = makeRouter('/en/company', config)
    expect(route.routeKey).toBe('/about')
  })

  it('stores alias source in routeConfig', () => {
    const route = makeRouter('/en/company', config)
    expect(route.aliasFrom).toBe('/company')
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
    expect(route.renderTo).toBeUndefined()
    expect(route.routeKey).toBe('/about')
    expect(route.logicalUrl).toBe('/about')
  })

  it('matches Russian localized alias path', () => {
    const route = makeRouter('/ru/spain/o-nas', config)
    expect(route.renderTo).toBeUndefined()
    expect(route.routeKey).toBe('/about')
  })

  it('alternateUrls use alias paths not target paths', () => {
    const route = makeRouter('/en/spain/about', config)
    const enAlt = route.alternateUrls.find((a) => a.locale === 'en')
    const ruAlt = route.alternateUrls.find((a) => a.locale === 'ru')
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
    expect(route.renderTo).toBeUndefined()
    expect(route.routeKey).toBe('/blog/:slug')
    expect(route.logicalUrl).toBe('/blog/my-post')
  })

  it('merges alias params with route params (including alias-only params)', () => {
    const route = makeRouter('/en/blog/spain/my-post', config)
    expect(route.params).toMatchObject({
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
    expect(route.renderTo).toBeUndefined()
    expect(route.routeKey).toBe('/blog/:slug')
    expect(route.logicalUrl).toBe('/blog/my-post')
  })

  it('includes alias-only params (country) in i18nUrlParams', () => {
    const route = makeRouter('/blog/spain/my-post', config)
    expect(route.params).toMatchObject({
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
    expect(route.renderTo).toBeUndefined()
    expect(route.routeKey).toBe('/medicines/:slug')
    expect(route.logicalUrl).toBe('/medicines/dsa')
    expect(route.params).toMatchObject({
      country: 'asd',
      slug: 'dsa',
    })
  })

  it('direct /medicines/dsa access is not treated as alias', () => {
    const route = makeRouter('/medicines/dsa', config)
    expect(route.renderTo).toBeUndefined()
    expect(route.routeKey).toBe('/medicines/:slug')
    expect(route.params).toEqual({ slug: 'dsa' })
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
    expect(route.renderTo).toBeUndefined()
    expect(route.routeKey).toBe('/medicines')
    expect(route.logicalUrl).toBe('/medicines')
  })

  it('includes all params from the chain', () => {
    const route = makeRouter('/medicines/ukraine/p/1', config)
    expect(route.params).toMatchObject({ country: 'ukraine', page: '1' })
  })

  it('stores outer alias source for chained aliases', () => {
    const route = makeRouter('/medicines/ukraine/p/1', config)
    expect(route.aliasFrom).toBe('/medicines/:country/*path')
  })

  it('/medicines/ukraine/aspirin still routes to /medicines/:slug', () => {
    const route = makeRouter('/medicines/ukraine/aspirin', config)
    expect(route.routeKey).toBe('/medicines/:slug')
    expect(route.logicalUrl).toBe('/medicines/aspirin')
    expect(route.params).toMatchObject({ country: 'ukraine', slug: 'aspirin' })
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
    expect(route.routeKey).toBe('/medicines')
    expect(route.logicalUrl).toBe('/medicines')
    expect(route.params).toMatchObject({ ingredient: 'aspirin' })
  })

  it('ru locale: routes lekarstva/ingredient/:ingredient to /medicines', () => {
    const route = makeRouter('/ru/lekarstva/ingredient/aspirin', config)
    expect(route.routeKey).toBe('/medicines')
    expect(route.logicalUrl).toBe('/medicines')
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
    expect(route.routeKey).toBe('/medicines')
    expect(route.logicalUrl).toBe('/medicines')
    expect(route.params).toMatchObject({ country: 'ukraine', manufacturer: '123' })
  })

  it('/medicines/ukraine/aspirin still routes to /medicines/:slug', () => {
    const route = makeRouter('/medicines/ukraine/aspirin', config)
    expect(route.routeKey).toBe('/medicines/:slug')
    expect(route.params).toMatchObject({ country: 'ukraine', slug: 'aspirin' })
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
    expect(route.renderTo).toBeUndefined()
    expect(route.logicalUrl).not.toBe('/about')
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
    expect(route.renderTo).toBeUndefined()
  })

  it('does not use alias for localized route path', () => {
    const route = makeRouter('/ru/o-nas', config)
    expect(route.renderTo).toBeUndefined()
  })
})

// ─── Optional multi-segment alias (bucket count bug regression) ─────────────

describe('optional multi-segment alias with pagination', () => {
  const config: I18nConfig = {
    defaultLocale: 'en',
    locales: ['en', 'ru'],
    prefixDefaultLocale: false,
    routes: {
      '/medicines/:slug': { en: '/medicines/:slug', ru: '/lekarstva/:slug' },
    },
    aliases: {
      '/medicines{/category/:slug}{/p/:page}': '/medicines{/:slug}',
    },
  }

  it('matches alias with category segment only', () => {
    const route = makeRouter('/medicines/category/aspirin', config)
    expect(route.routeKey).toBe('/medicines/:slug')
    expect(route.params).toMatchObject({ slug: 'aspirin' })
  })

  it('matches alias with both category and pagination segments', () => {
    const route = makeRouter('/medicines/category/aspirin/p/1', config)
    expect(route.routeKey).toBe('/medicines/:slug')
    expect(route.params).toMatchObject({ slug: 'aspirin', page: '1' })
  })
})

// ─── Alias + redirect coexistence ───────────────────────────────────────────
// Redirect fires first: /p/1 stripped → then alias resolves the remaining URL.

describe('redirect then alias — pagination stripped before alias match', () => {
  const config: I18nConfig = {
    defaultLocale: 'en',
    locales: ['en', 'ru'],
    prefixDefaultLocale: false,
    routes: {
      '/doctors': { en: '/doctors', ru: '/vrachi' },
    },
    aliases: {
      '/doctors{/speciality/:speciality}{/p/:page}': {
        target: '/doctors',
        en: '/doctors{/speciality/:speciality}{/p/:page}',
        ru: '/vrachi{/specialnost/:speciality}{/p/:page}',
      },
    },
    redirects: {
      '*path/p': '*path',
      '*path/p/1': '*path',
    },
  }

  it('redirects /doctors/speciality/blabla/p/1 to /doctors/speciality/blabla (redirect fires first)', () => {
    const route = makeRouter('/doctors/speciality/blabla/p/1', config)
    expect(route.redirectTo).toBeDefined()
    expect(route.redirectTo).toContain('/doctors/speciality/blabla')
  })

  it('resolves alias after redirect — /doctors/speciality/blabla matches alias', () => {
    const route = makeRouter('/doctors/speciality/blabla', config)
    expect(route.routeKey).toBe('/doctors')
    expect(route.redirectTo).toBeUndefined()
    expect(route.params).toMatchObject({ speciality: 'blabla' })
  })

  it('redirects /doctors/blabla/p/1 (no alias) to /doctors/blabla', () => {
    const route = makeRouter('/doctors/blabla/p/1', config)
    expect(route.redirectTo).toBeDefined()
    expect(route.redirectTo).toContain('/doctors/blabla')
  })
})
