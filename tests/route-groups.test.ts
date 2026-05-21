import { describe, expect, it } from 'vitest'
import { generateStaticPaths } from '../lib'
import { createPageContext } from '../lib/core/pageContext'
import { createI18nRouter } from '../lib/core/router'
import { onBeforeRoute } from '../lib/vike/onBeforeRoute'
import type { I18nConfig } from '../lib/core/types'
import { createTestRouter } from './helpers/pageContext'

const groupedRoutesConfig: I18nConfig = {
  defaultLocale: 'en',
  locales: ['en', 'ru'],
  prefixDefaultLocale: true,
  routes: {
    '/': { en: '/', ru: '/' },
    '/blog': {
      '/:slug': {
        en: '/:slug',
        ru: '/:slug',
      },
      '/category/:category': {
        en: '/category/:category',
        ru: '/kategoriya/:category',
      },
    },
    '/shop': {
      '/cart': {
        en: '/cart',
        ru: '/korzina',
      },
    },
  },
}

describe('routes — grouped definitions', () => {
  it('resolves nested localized routes to their canonical path', () => {
    const result = onBeforeRoute(createPageContext('https://site.com/ru/shop/korzina', {
      config: { i18n: groupedRoutesConfig },
      headers: { host: 'site.com' },
    }) as any)

    expect(result.pageContext.locale).toBe('ru')
    expect(result.pageContext.i18nRoute!.logicalUrl).toBe('/shop/cart')
    expect(result.pageContext.i18nRoute!.currentLocaleUrl).toBe('/ru/shop/korzina')
  })

  it('localizes canonical paths from grouped routes', () => {
    const route = createTestRouter('/en/blog/category/design', groupedRoutesConfig)

    expect(route.logicalUrl).toBe('/blog/category/design')
    expect(route.localizePath('/blog/category/design', 'ru')).toBe('/ru/blog/kategoriya/design')
  })

  it('generates static paths from grouped static routes', async () => {
    const paths = await generateStaticPaths(groupedRoutesConfig)

    expect(paths).toEqual([
      '/en',
      '/ru',
      '/en/shop/cart',
      '/ru/shop/korzina',
    ])
  })

  it('generates static paths from grouped dynamic routes when routeParams are provided', async () => {
    const paths = await generateStaticPaths(groupedRoutesConfig, {
      routeParams: {
        '/blog/:slug': [
          { slug: 'hello-world' },
        ],
        '/blog/category/:category': [
          { category: 'design' },
        ],
      },
    })

    expect(paths).toEqual([
      '/en',
      '/ru',
      '/en/blog/hello-world',
      '/ru/blog/hello-world',
      '/en/blog/category/design',
      '/ru/blog/kategoriya/design',
      '/en/shop/cart',
      '/ru/shop/korzina',
    ])
  })
})

describe('domains — grouped route overrides', () => {
  const config: I18nConfig = {
    ...groupedRoutesConfig,
    domains: {
      'ru.site.com': {
        defaultLocale: 'ru',
        locales: ['ru'],
        prefixDefaultLocale: false,
        routes: {
          '/shop': {
            '/cart': {
              ru: '/telezhka',
            },
          },
        },
      },
    },
  }

  it('merges grouped domain overrides after route normalization', () => {
    const pageContext = createPageContext('https://ru.site.com/shop/telezhka', {
      config: { i18n: config },
      headers: { host: 'ru.site.com' },
    })

    const route = createI18nRouter('/shop/telezhka', pageContext)
    expect(route.logicalUrl).toBe('/shop/cart')
    expect(route.currentLocaleUrl).toBe('/shop/telezhka')
  })
})
