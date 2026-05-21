import { createUseI18nRoute } from '../../lib'
import type { I18nConfig } from '../../lib'

const flatConfig = {
  defaultLocale: 'en',
  locales: ['en', 'ru'],
  routes: {
    '/': { en: '/', ru: '/' },
    '/about': { en: '/about', ru: '/o-nas' },
    '/services/:item': { en: '/services/:item', ru: '/uslugi/:item' },
  },
} as const satisfies I18nConfig

const useFlatI18nRoute = createUseI18nRoute(flatConfig)
declare const flatPageContext: Parameters<typeof useFlatI18nRoute>[0]

const flatRoute = useFlatI18nRoute(flatPageContext)
flatRoute.localizePath('/about')
flatRoute.localizePath('/services/:item', { params: { item: 'web-development' } })
flatRoute.switchLocaleUrl('ru')
flatRoute.switchLocaleUrl('ru', { params: { item: 'web-development' } })
flatRoute.route('/about')

// @ts-expect-error invalid flat route key
flatRoute.localizePath('/servises/:item')

// @ts-expect-error invalid flat route descriptor key
flatRoute.route('/missing')

const groupedConfig = {
  defaultLocale: 'en',
  locales: ['en', 'ru'],
  routes: {
    '/': { en: '/', ru: '/' },
    '/blog': {
      '/:slug': { en: '/:slug', ru: '/:slug' },
      '/category/:category': {
        en: '/category/:category',
        ru: '/kategoriya/:category',
      },
    },
  },
} as const satisfies I18nConfig

const useGroupedI18nRoute = createUseI18nRoute(groupedConfig)
declare const groupedPageContext: Parameters<typeof useGroupedI18nRoute>[0]

const groupedRoute = useGroupedI18nRoute(groupedPageContext)
groupedRoute.localizePath('/blog/:slug')
groupedRoute.localizePath('/blog/category/:category')
groupedRoute.switchLocaleUrl('ru')

// @ts-expect-error namespace keys are not route keys by themselves
groupedRoute.localizePath('/blog')
