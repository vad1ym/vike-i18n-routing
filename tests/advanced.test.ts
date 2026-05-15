import { describe, expect, it } from 'vitest'
import { redirect } from 'vike/abort'
import { createSetCookieHeader, resolveCookieAction } from '../lib/core/cookies'
import { createPageContext } from '../lib/core/pageContext'
import { createI18nRouter } from '../lib/core/router'
import { useI18nRoute } from '../lib/core/useI18nRoute'
import { onBeforeRoute } from '../lib/vike/onBeforeRoute'
import { makePageContext, getRedirectUrl, resolveRenderRedirect } from './helpers/pageContext'
import type { I18nConfig } from '../lib/core/types'

const domainConfig: I18nConfig = {
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
      meta: {
        supportedAuthCountries: ['fr', 'uk', 'ru'],
      },
    },
  },
  routes: {
    '/': { en: '/', ru: '/', fr: '/' },
    '/about': { en: '/about', ru: '/o-nas', fr: '/a-propos' },
    '/services/:category{/:tab}': {
      en: '/services/:category{/:tab}',
      ru: '/uslugi/:category{/:tab}',
      fr: '/services-fr/:category{/:tab}',
    },
  },
  localeCookie: 'locale',
}

const pageContext = createPageContext('https://site.com/about', {
  config: { i18n: domainConfig },
  headers: { host: 'site.com' },
})

describe('advanced features', () => {
  it('detects locale from cookie and accept-language', () => {
    expect(
      resolveRenderRedirect(
        makePageContext('/about', domainConfig, {
          headers: { host: 'site.com', cookie: 'locale=ru' },
        }),
      ),
    ).toBe('/ru/o-nas')

    expect(
      resolveRenderRedirect(
        makePageContext('/about', domainConfig, {
          headers: { host: 'site.com', 'accept-language': 'fr-CA,fr;q=0.8,en;q=0.5' },
        }),
      ),
    ).toBe('/en/about')
  })

  it('matches optional segments and localizes them', () => {
    const result = onBeforeRoute(
      makePageContext('/ru/uslugi/design', domainConfig, {
        headers: { host: 'site.com' },
      }) as any,
    )

    expect(result.pageContext.i18nRoute!.routeConfig.canonicalUrl).toBe('/services/design')
    const i18nRoute = useI18nRoute({ ...makePageContext('/ru/uslugi/design', domainConfig, { headers: { host: 'site.com' } }), i18nRoute: result.pageContext.i18nRoute! } as any)
    expect(i18nRoute.localizePath('/services/design/specs', 'ru')).toBe('/ru/uslugi/design/specs')
  })

  it('uses slug variants for params and redirects foreign variants', () => {
    const routeParamVariants = {
      en: 'web-development',
      ru: 'veb-razrabotka',
      fr: 'developpement-web',
    }

    const ruPageContext = makePageContext('/ru/uslugi/veb-razrabotka', domainConfig, { headers: { host: 'site.com' } })
    const ruI18n = useI18nRoute({ ...ruPageContext, i18nRoute: createI18nRouter('/ru/uslugi/veb-razrabotka', ruPageContext) } as any)
    ruI18n.setRouteParamVariants('category', routeParamVariants)
    expect(ruI18n.routeConfig.canonicalUrl).toBe('/services/web-development')

    const invalidEnPageContext = makePageContext('/en/services/veb-razrabotka', domainConfig, { headers: { host: 'site.com' } })
    const invalidEnI18n = useI18nRoute({ ...invalidEnPageContext, i18nRoute: createI18nRouter('/en/services/veb-razrabotka', invalidEnPageContext) } as any)
    invalidEnI18n.setRouteParamVariants('category', routeParamVariants)

    try {
      const redirectTo = invalidEnI18n.routeConfig.redirectTo
      if (redirectTo) throw redirect(redirectTo)
    } catch (error) {
      expect(getRedirectUrl(error)).toBe('/en/services/web-development')
    }

    const frPageContext = createPageContext('https://site.fr/services-fr/developpement-web', {
      config: { i18n: domainConfig },
      headers: { host: 'site.fr' },
      domain: 'site.fr',
    })
    const frI18n = useI18nRoute({ ...frPageContext, i18nRoute: createI18nRouter('/services-fr/developpement-web', frPageContext) } as any)
    frI18n.setRouteParamVariants('category', routeParamVariants)

    expect(
      frI18n.localizePath('/services/web-development', 'fr'),
    ).toBe('/services-fr/developpement-web')
  })

  it('updates pageContext.i18nRoute.routeConfig after setRouteParamVariants', () => {
    const pc = makePageContext('/en/services/web-development', domainConfig, { headers: { host: 'site.com' } })
    const i18nRoute = useI18nRoute({ ...pc, i18nRoute: createI18nRouter('/en/services/web-development', pc) } as any)

    i18nRoute.setRouteParamVariants(
      'category',
      {
        en: 'web-development',
        ru: 'veb-razrabotka',
        fr: 'developpement-web',
      },
    )

    expect(i18nRoute.routeConfig.redirectTo).toBeUndefined()
    expect(i18nRoute.routeConfig.currentLocaleUrl).toBe('/en/services/web-development')
    expect(i18nRoute.routeConfig.defaultLocaleUrl).toBe('/en/services/web-development')
    expect(i18nRoute.routeConfig.alternateUrls).toEqual([
      { locale: 'en', url: '/en/services/web-development' },
      { locale: 'ru', url: '/ru/uslugi/veb-razrabotka' },
    ])
  })

  it('localizes query variants and stores canonical query values in routeConfig', () => {
    const pc = makePageContext('/ru/o-nas?focus=frontend-ru', domainConfig, { headers: { host: 'site.com' } })
    const i18nRoute = useI18nRoute({
      ...pc,
      i18nRoute: createI18nRouter('/ru/o-nas?focus=frontend-ru', pc),
    } as any)

    i18nRoute.setRouteQueryVariants('focus', {
      en: 'frontend',
      ru: 'frontend-ru',
    })

    expect(i18nRoute.routeConfig.canonicalUrl).toBe('/about?focus=frontend')
    expect(i18nRoute.routeConfig.currentLocaleUrl).toBe('/ru/o-nas?focus=frontend-ru')
    expect(i18nRoute.routeConfig.defaultLocaleUrl).toBe('/en/about?focus=frontend')
    expect(i18nRoute.routeConfig.alternateUrls).toEqual([
      { locale: 'en', url: '/en/about?focus=frontend' },
      { locale: 'ru', url: '/ru/o-nas?focus=frontend-ru' },
    ])
    expect(i18nRoute.routeConfig.queryVariants).toEqual({
      focus: {
        variants: {
          en: 'frontend',
          ru: 'frontend-ru',
        },
      },
    })
  })

  it('redirects foreign query variants to the current locale variant', () => {
    const pc = makePageContext('/en/about?focus=frontend-ru', domainConfig, { headers: { host: 'site.com' } })
    const i18nRoute = useI18nRoute({
      ...pc,
      i18nRoute: createI18nRouter('/en/about?focus=frontend-ru', pc),
    } as any)

    i18nRoute.setRouteQueryVariants('focus', {
      en: 'frontend',
      ru: 'frontend-ru',
    })

    expect(i18nRoute.routeConfig.redirectTo).toBe('/en/about?focus=frontend')
  })

  it('preserves explicit default locale intent when query variant redirect removes the default prefix', () => {
    const config: I18nConfig = {
      ...domainConfig,
      prefixDefaultLocale: false,
    }
    const pc = makePageContext('/en/o-nas?focus=frontend-ru', config, { headers: { host: 'site.com' } })
    const i18nRoute = useI18nRoute({
      ...pc,
      i18nRoute: createI18nRouter('/en/o-nas?focus=frontend-ru', pc),
    } as any)

    i18nRoute.setRouteQueryVariants('focus', {
      en: 'frontend',
      ru: 'frontend-ru',
    })

    expect(i18nRoute.routeConfig.redirectTo).toBe('/about?focus=frontend&locale=en')
  })

  it('preserves locale query intent across query-value normalization redirects', () => {
    const config: I18nConfig = {
      ...domainConfig,
      prefixDefaultLocale: false,
    }
    const pc = makePageContext('/specialities?focus=frontend-ru&locale=en', config, { headers: { host: 'site.com' } })
    const i18nRoute = useI18nRoute({
      ...pc,
      i18nRoute: createI18nRouter('/specialities?focus=frontend-ru&locale=en', pc),
    } as any)

    i18nRoute.setRouteQueryVariants('focus', {
      en: 'frontend',
      ru: 'frontend-ru',
    })

    expect(i18nRoute.routeConfig.redirectTo).toBe('/specialities?focus=frontend&locale=en')
  })

  it('normalizes internal pageContext.json requests back to page URLs', () => {
    const config: I18nConfig = {
      ...domainConfig,
      prefixDefaultLocale: false,
      routes: {
        ...domainConfig.routes,
        '/specialities': { en: '/specialities', ru: '/specialnosti' },
      },
    }
    const pc = makePageContext('/specialities/index.pageContext.json?focus=frontend-ru&locale=en', config, {
      headers: { host: 'site.com' },
    })
    const i18nRoute = useI18nRoute({
      ...pc,
      i18nRoute: createI18nRouter('/specialities/index.pageContext.json?focus=frontend-ru&locale=en', pc),
    } as any)

    i18nRoute.setRouteQueryVariants('focus', {
      en: 'frontend',
      ru: 'frontend-ru',
    })

    expect(i18nRoute.routeConfig.redirectTo).toBe('/specialities?focus=frontend&locale=en')
  })

  it('keeps the canonical query value when target locale has no registered variant', () => {
    const pc = makePageContext('/en/about?focus=frontend', domainConfig, { headers: { host: 'site.com' } })
    const i18nRoute = useI18nRoute({
      ...pc,
      i18nRoute: createI18nRouter('/en/about?focus=frontend', pc),
    } as any)

    i18nRoute.setRouteQueryVariants('focus', {
      en: 'frontend',
    })

    expect(i18nRoute.localizePath('/about?focus=frontend', 'ru')).toBe('/ru/o-nas?focus=frontend')
  })

  it('builds alternates from the shared resolver', () => {
    expect(createI18nRouter('/about', pageContext).routeConfig.alternateUrls).toEqual([
      { locale: 'en', url: '/en/about' },
      { locale: 'ru', url: '/ru/o-nas' },
    ])
  })

  it('serializes locale cookies via the renamed cookie helper', () => {
    const action = resolveCookieAction('ru', domainConfig)
    expect(action?.name).toBe('locale')
    expect(createSetCookieHeader(action!)).toBe('locale=ru; Path=/; SameSite=Lax; HttpOnly')
  })
})
