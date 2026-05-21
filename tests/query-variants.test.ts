import { describe, expect, it } from 'vitest'
import { createPageContext } from '../lib/core/pageContext'
import { createI18nRouter } from '../lib/core/router'
import { useI18nRoute } from '../lib/core/useI18nRoute'
import { makePageContext } from './helpers/pageContext'
import type { I18nConfig } from '../lib/core/types'

const config: I18nConfig = {
  defaultLocale: 'en',
  locales: ['en', 'ru'],
  prefixDefaultLocale: true,
  domains: {
    'site.com': {
      defaultLocale: 'en',
      locales: ['en', 'ru'],
    },
  },
  routes: {
    '/about': { en: '/about', ru: '/o-nas' },
    '/specialities': { en: '/specialities', ru: '/specialnosti' },
  },
}

const focusVariants = { en: 'frontend', ru: 'frontend-ru' }

function makeCtx(path: string) {
  return makePageContext(path, config, { headers: { host: 'site.com' } })
}

describe('query variants — resolution', () => {
  it('canonicalizes RU query value after setRouteQueryVariants', () => {
    const pc = makeCtx('/ru/o-nas?focus=frontend-ru')
    const i18nRoute = useI18nRoute({ ...pc, i18nRoute: createI18nRouter('/ru/o-nas?focus=frontend-ru', pc) } as any)
    i18nRoute.setRouteQueryVariants('focus', focusVariants)

    expect(i18nRoute.logicalUrl).toBe('/about?focus=frontend')
  })

  it('builds correct currentLocaleUrl and defaultLocaleUrl', () => {
    const pc = makeCtx('/ru/o-nas?focus=frontend-ru')
    const i18nRoute = useI18nRoute({ ...pc, i18nRoute: createI18nRouter('/ru/o-nas?focus=frontend-ru', pc) } as any)
    i18nRoute.setRouteQueryVariants('focus', focusVariants)

    expect(i18nRoute.currentLocaleUrl).toBe('/ru/o-nas?focus=frontend-ru')
    expect(i18nRoute.defaultLocaleUrl).toBe('/en/about?focus=frontend')
  })

  it('builds correct alternateUrls with localized query values', () => {
    const pc = makeCtx('/ru/o-nas?focus=frontend-ru')
    const i18nRoute = useI18nRoute({ ...pc, i18nRoute: createI18nRouter('/ru/o-nas?focus=frontend-ru', pc) } as any)
    i18nRoute.setRouteQueryVariants('focus', focusVariants)

    expect(i18nRoute.alternateUrls).toEqual([
      { locale: 'en', url: '/en/about?focus=frontend' },
      { locale: 'ru', url: '/ru/o-nas?focus=frontend-ru' },
    ])
  })

  it('stores registered queryVariants in routeConfig', () => {
    const pc = makeCtx('/ru/o-nas?focus=frontend-ru')
    const i18nRoute = useI18nRoute({ ...pc, i18nRoute: createI18nRouter('/ru/o-nas?focus=frontend-ru', pc) } as any)
    i18nRoute.setRouteQueryVariants('focus', focusVariants)

    expect(i18nRoute.queryVariants).toEqual({
      focus: { variants: focusVariants },
    })
  })
})

describe('query variants — redirects', () => {
  it('redirects foreign query value to current locale variant', () => {
    const pc = makeCtx('/en/about?focus=frontend-ru')
    const i18nRoute = useI18nRoute({ ...pc, i18nRoute: createI18nRouter('/en/about?focus=frontend-ru', pc) } as any)
    i18nRoute.setRouteQueryVariants('focus', focusVariants)

    expect(i18nRoute.redirectTo).toBe('/en/about?focus=frontend')
  })

  it('preserves locale intent when query variant redirect removes default prefix', () => {
    const noPrefixConfig: I18nConfig = { ...config, prefixDefaultLocale: false }
    const pc = makePageContext('/en/o-nas?focus=frontend-ru', noPrefixConfig, { headers: { host: 'site.com' } })
    const i18nRoute = useI18nRoute({ ...pc, i18nRoute: createI18nRouter('/en/o-nas?focus=frontend-ru', pc) } as any)
    i18nRoute.setRouteQueryVariants('focus', focusVariants)

    expect(i18nRoute.redirectTo).toBe('/about?focus=frontend&locale=en')
  })

  it('preserves locale query across query-value normalization redirects', () => {
    const noPrefixConfig: I18nConfig = { ...config, prefixDefaultLocale: false }
    const pc = makePageContext('/specialities?focus=frontend-ru&locale=en', noPrefixConfig, { headers: { host: 'site.com' } })
    const i18nRoute = useI18nRoute({ ...pc, i18nRoute: createI18nRouter('/specialities?focus=frontend-ru&locale=en', pc) } as any)
    i18nRoute.setRouteQueryVariants('focus', focusVariants)

    expect(i18nRoute.redirectTo).toBe('/specialities?focus=frontend&locale=en')
  })
})

describe('query variants — edge cases', () => {
  it('keeps canonical query value when target locale has no registered variant', () => {
    const pc = makeCtx('/en/about?focus=frontend')
    const i18nRoute = useI18nRoute({ ...pc, i18nRoute: createI18nRouter('/en/about?focus=frontend', pc) } as any)
    i18nRoute.setRouteQueryVariants('focus', { en: 'frontend' })

    expect(i18nRoute.localizePath('/about?focus=frontend', 'ru')).toBe('/ru/o-nas?focus=frontend')
  })

  it('normalizes pageContext.json requests before applying query variants', () => {
    const extConfig: I18nConfig = {
      ...config,
      prefixDefaultLocale: false,
      routes: {
        ...config.routes,
        '/specialities': { en: '/specialities', ru: '/specialnosti' },
      },
    }
    const pc = makePageContext(
      '/specialities/index.pageContext.json?focus=frontend-ru&locale=en',
      extConfig,
      { headers: { host: 'site.com' } },
    )
    const i18nRoute = useI18nRoute({
      ...pc,
      i18nRoute: createI18nRouter('/specialities/index.pageContext.json?focus=frontend-ru&locale=en', pc),
    } as any)
    i18nRoute.setRouteQueryVariants('focus', focusVariants)

    expect(i18nRoute.redirectTo).toBe('/specialities?focus=frontend&locale=en')
  })
})

describe('localizePath — query option', () => {
  it('appends plain query params', () => {
    const ctx = createPageContext('https://site.com/en/about', {
      config: { i18n: config },
      headers: { host: 'site.com' },
    })
    const i18nRoute = useI18nRoute({ ...ctx, i18nRoute: createI18nRouter('/en/about', ctx) } as any)

    expect(i18nRoute.localizePath('/about', 'ru', { query: { ref: 'banner' } }))
      .toBe('/ru/o-nas?ref=banner')
  })

  it('localizes query values via globally registered queryVariants', () => {
    const ctx = createPageContext('https://site.com/en/about', {
      config: { i18n: config },
      headers: { host: 'site.com' },
    })
    const i18nRoute = useI18nRoute({ ...ctx, i18nRoute: createI18nRouter('/en/about', ctx) } as any)
    i18nRoute.setRouteQueryVariants('focus', focusVariants)

    expect(i18nRoute.localizePath('/about', 'ru', { query: { focus: 'frontend' } }))
      .toBe('/ru/o-nas?focus=frontend-ru')
  })

  it('localizes query values via inline queryVariants without mutating global state', () => {
    const ctx = createPageContext('https://site.com/en/about', {
      config: { i18n: config },
      headers: { host: 'site.com' },
    })
    const i18nRoute = useI18nRoute({ ...ctx, i18nRoute: createI18nRouter('/en/about', ctx) } as any)

    const result = i18nRoute.localizePath('/about', 'ru', {
      query: { category: 'electronics' },
      queryVariants: { category: { en: 'electronics', ru: 'elektronika' } },
    })

    expect(result).toBe('/ru/o-nas?category=elektronika')
    expect(i18nRoute.queryVariants).not.toHaveProperty('category')
  })

  it('inline queryVariants take precedence over globally registered ones', () => {
    const ctx = createPageContext('https://site.com/en/about', {
      config: { i18n: config },
      headers: { host: 'site.com' },
    })
    const i18nRoute = useI18nRoute({ ...ctx, i18nRoute: createI18nRouter('/en/about', ctx) } as any)
    i18nRoute.setRouteQueryVariants('focus', { en: 'frontend', ru: 'frontend-ru' })

    const result = i18nRoute.localizePath('/about', 'ru', {
      query: { focus: 'work' },
      queryVariants: { focus: { en: 'work', ru: 'rabota' } },
    })

    expect(result).toBe('/ru/o-nas?focus=rabota')
    // Global state unchanged
    expect(i18nRoute.queryVariants.focus.variants.ru).toBe('frontend-ru')
  })
})
