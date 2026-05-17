import { describe, expect, it } from 'vitest'
import { createPageContext } from '../lib/core/pageContext'
import { createI18nRouter } from '../lib/core/router'
import { useI18nRoute } from '../lib/core/useI18nRoute'
import { onBeforeRoute } from '../lib/vike/onBeforeRoute'
import { makePageContext, getRedirectUrl } from './helpers/pageContext'
import type { I18nConfig } from '../lib/core/types'

const config: I18nConfig = {
  defaultLocale: 'en',
  locales: ['en', 'ru', 'fr'],
  prefixDefaultLocale: true,
  domains: {
    'site.com': {
      defaultLocale: 'en',
      locales: ['en', 'ru'],
    },
    'site.fr': {
      defaultLocale: 'fr',
      locales: ['fr', 'en'],
      prefixDefaultLocale: false,
    },
  },
  routes: {
    '/services/:category{/:tab}': {
      en: '/services/:category{/:tab}',
      ru: '/uslugi/:category{/:tab}',
      fr: '/services-fr/:category{/:tab}',
    },
  },
}

const slugVariants = {
  en: 'web-development',
  ru: 'veb-razrabotka',
  fr: 'developpement-web',
}

function makeEnCtx(path: string) {
  return makePageContext(path, config, { headers: { host: 'site.com' } })
}

function makeRuCtx(path: string) {
  return makePageContext(path, config, { headers: { host: 'site.com' } })
}

describe('param variants — resolution', () => {
  it('resolves RU slug to canonical after setRouteParamVariants', () => {
    const pc = makeRuCtx('/ru/uslugi/veb-razrabotka')
    const i18nRoute = useI18nRoute({ ...pc, i18nRoute: createI18nRouter('/ru/uslugi/veb-razrabotka', pc) } as any)
    i18nRoute.setRouteParamVariants('category', slugVariants)
    expect(i18nRoute.routeConfig.canonicalUrl).toBe('/services/web-development')
  })

  it('produces no redirect when slug matches current locale', () => {
    const pc = makeEnCtx('/en/services/web-development')
    const i18nRoute = useI18nRoute({ ...pc, i18nRoute: createI18nRouter('/en/services/web-development', pc) } as any)
    i18nRoute.setRouteParamVariants('category', slugVariants)
    expect(i18nRoute.routeConfig.redirectTo).toBeUndefined()
  })

  it('redirects foreign slug to correct locale slug', () => {
    const pc = makeEnCtx('/en/services/veb-razrabotka')
    const i18nRoute = useI18nRoute({ ...pc, i18nRoute: createI18nRouter('/en/services/veb-razrabotka', pc) } as any)
    i18nRoute.setRouteParamVariants('category', slugVariants)
    expect(i18nRoute.routeConfig.redirectTo).toBe('/en/services/web-development')
  })
})

describe('param variants — routeConfig updates', () => {
  it('updates currentLocaleUrl and defaultLocaleUrl after setRouteParamVariants', () => {
    const pc = makeEnCtx('/en/services/web-development')
    const i18nRoute = useI18nRoute({ ...pc, i18nRoute: createI18nRouter('/en/services/web-development', pc) } as any)
    i18nRoute.setRouteParamVariants('category', slugVariants)

    expect(i18nRoute.routeConfig.currentLocaleUrl).toBe('/en/services/web-development')
    expect(i18nRoute.routeConfig.defaultLocaleUrl).toBe('/en/services/web-development')
  })

  it('builds correct alternateUrls for all locales after setRouteParamVariants', () => {
    const pc = makeEnCtx('/en/services/web-development')
    const i18nRoute = useI18nRoute({ ...pc, i18nRoute: createI18nRouter('/en/services/web-development', pc) } as any)
    i18nRoute.setRouteParamVariants('category', slugVariants)

    expect(i18nRoute.routeConfig.alternateUrls).toEqual([
      { locale: 'en', url: '/en/services/web-development' },
      { locale: 'ru', url: '/ru/uslugi/veb-razrabotka' },
    ])
  })

  it('builds correct localized URL on domain with prefixDefaultLocale:false', () => {
    const frCtx = createPageContext('https://site.fr/services-fr/developpement-web', {
      config: { i18n: config },
      headers: { host: 'site.fr' },
      domain: 'site.fr',
    })
    const i18nRoute = useI18nRoute({ ...frCtx, i18nRoute: createI18nRouter('/services-fr/developpement-web', frCtx) } as any)
    i18nRoute.setRouteParamVariants('category', slugVariants)

    expect(i18nRoute.localizePath('/services/web-development', 'fr')).toBe('/services-fr/developpement-web')
  })
})

describe('param variants — optional segments', () => {
  it('resolves optional segment path to canonical', () => {
    const result = onBeforeRoute(makePageContext('/ru/uslugi/design', config, { headers: { host: 'site.com' } }) as any)
    expect(result.pageContext.i18nRoute!.routeConfig.canonicalUrl).toBe('/services/design')
  })

  it('localizes path with optional segment for another locale', () => {
    const result = onBeforeRoute(makePageContext('/ru/uslugi/design', config, { headers: { host: 'site.com' } }) as any)
    const pc = { ...makePageContext('/ru/uslugi/design', config, { headers: { host: 'site.com' } }), i18nRoute: result.pageContext.i18nRoute! }
    const i18nRoute = useI18nRoute(pc as any)
    expect(i18nRoute.localizePath('/services/design/specs', 'ru')).toBe('/ru/uslugi/design/specs')
  })
})

describe('localizePath — params option', () => {
  const paramConfig: I18nConfig = {
    defaultLocale: 'en',
    locales: ['en', 'ru'],
    prefixDefaultLocale: true,
    routes: {
      '/services/:item': { en: '/services/:item', ru: '/uslugi/:item' },
    },
  }

  function makeCtx(path: string) {
    return createPageContext(`https://site.com${path}`, {
      config: { i18n: paramConfig },
      headers: { host: 'site.com' },
    })
  }

  it('interpolates params and localizes for target locale', () => {
    const ctx = makeCtx('/en/services/web')
    const routeResult = onBeforeRoute(ctx as any)
    const i18nRoute = useI18nRoute({ ...ctx, i18nRoute: routeResult.pageContext.i18nRoute! } as any)

    expect(i18nRoute.localizePath('/services/:item', 'ru', { params: { item: 'web-development' } }))
      .toBe('/ru/uslugi/web-development')
    expect(i18nRoute.localizePath('/services/:item', 'en', { params: { item: 'design' } }))
      .toBe('/en/services/design')
  })

  it('formats dynamic route descriptor directly', () => {
    const ctx = makeCtx('/en/services/web')
    const routeResult = onBeforeRoute(ctx as any)
    const i18nRoute = useI18nRoute({ ...ctx, i18nRoute: routeResult.pageContext.i18nRoute! } as any)
    const service = i18nRoute.route('/services/:item')

    expect(service.to('ru', { params: { item: 'web-development' } }))
      .toBe('/ru/uslugi/web-development')
  })

  it('handles params and query together', () => {
    const searchConfig: I18nConfig = {
      defaultLocale: 'en',
      locales: ['en', 'ru'],
      prefixDefaultLocale: true,
      routes: {
        '/search/:type': { en: '/search/:type', ru: '/poisk/:type' },
      },
    }
    const ctx = createPageContext('https://site.com/en/search/doctors', {
      config: { i18n: searchConfig },
      headers: { host: 'site.com' },
    })
    const routeResult = onBeforeRoute(ctx as any)
    const i18nRoute = useI18nRoute({ ...ctx, i18nRoute: routeResult.pageContext.i18nRoute! } as any)

    expect(i18nRoute.localizePath('/search/:type', 'ru', { params: { type: 'doctors' }, query: { page: '2' } }))
      .toBe('/ru/poisk/doctors?page=2')
  })
})

describe('localizePath — inline paramVariants', () => {
  function makeCtx(path: string) {
    return createPageContext(`https://site.com${path}`, {
      config: { i18n: config },
      headers: { host: 'site.com' },
    })
  }

  it('localizes using inline paramVariants without mutating global state', () => {
    const pc = makeCtx('/en/services/web-development')
    const i18nRoute = useI18nRoute({ ...pc, i18nRoute: createI18nRouter('/en/services/web-development', pc) } as any)

    const result = i18nRoute.localizePath('/services/:category', 'ru', {
      paramVariants: { category: { en: 'web-development', ru: 'veb-razrabotka' } },
    })

    expect(result).toBe('/ru/uslugi/veb-razrabotka')
    expect(i18nRoute.routeConfig.paramVariants).not.toHaveProperty('category')
  })

  it('inline paramVariants take precedence over globally registered ones', () => {
    const pc = makeCtx('/en/services/web-development')
    const i18nRoute = useI18nRoute({ ...pc, i18nRoute: createI18nRouter('/en/services/web-development', pc) } as any)

    i18nRoute.setRouteParamVariants('category', { en: 'web-development', ru: 'veb-razrabotka' })

    const result = i18nRoute.localizePath('/services/:category', 'ru', {
      paramVariants: { category: { en: 'design', ru: 'dizajn' } },
    })

    expect(result).toBe('/ru/uslugi/dizajn')
    // Global state stays unchanged
    expect(i18nRoute.routeConfig.paramVariants.category.variants.ru).toBe('veb-razrabotka')
  })
})

describe('localizePath — prefix option', () => {
  const simpleConfig: I18nConfig = {
    defaultLocale: 'en',
    locales: ['en', 'ru'],
    prefixDefaultLocale: true,
    routes: {
      '/about': { en: '/about', ru: '/o-nas' },
    },
  }

  function makeCtx() {
    return createPageContext('https://site.com/en/about', {
      config: { i18n: simpleConfig },
      headers: { host: 'site.com' },
    })
  }

  it('excludes locale prefix when prefix:false', () => {
    const ctx = makeCtx()
    const i18nRoute = useI18nRoute({ ...ctx, i18nRoute: createI18nRouter('/en/about', ctx) } as any)
    expect(i18nRoute.localizePath('/about', 'ru', { prefix: false })).toBe('/o-nas')
    expect(i18nRoute.localizePath('/about', 'en', { prefix: false })).toBe('/about')
  })

  it('forces prefix for default locale when prefix:true', () => {
    const noPrefixConfig: I18nConfig = {
      ...simpleConfig,
      prefixDefaultLocale: false,
    }
    const ctx = createPageContext('https://site.com/about', {
      config: { i18n: noPrefixConfig },
      headers: { host: 'site.com' },
    })
    const i18nRoute = useI18nRoute({ ...ctx, i18nRoute: createI18nRouter('/about', ctx) } as any)
    expect(i18nRoute.localizePath('/about', 'en', { prefix: true })).toBe('/en/about')
  })
})

describe('localizePath — prefixDefaultLocale:false', () => {
  const noPrefixConfig: I18nConfig = {
    defaultLocale: 'en',
    locales: ['en', 'ru'],
    prefixDefaultLocale: false,
    routes: {
      '/about': { en: '/about', ru: '/o-nas' },
    },
  }

  function makeCtx() {
    return createPageContext('https://site.com/about', {
      config: { i18n: noPrefixConfig },
      headers: { host: 'site.com' },
    })
  }

  it('returns unprefixed path for default locale', () => {
    const ctx = makeCtx()
    const i18nRoute = useI18nRoute({ ...ctx, i18nRoute: createI18nRouter('/about', ctx) } as any)
    expect(i18nRoute.localizePath('/about', 'en')).toBe('/about')
  })

  it('returns prefixed path for non-default locale', () => {
    const ctx = makeCtx()
    const i18nRoute = useI18nRoute({ ...ctx, i18nRoute: createI18nRouter('/about', ctx) } as any)
    expect(i18nRoute.localizePath('/about', 'ru')).toBe('/ru/o-nas')
  })
})
