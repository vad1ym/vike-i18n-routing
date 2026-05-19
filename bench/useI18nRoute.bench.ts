import { bench, describe } from 'vitest'
import { createTestRouter } from '../tests/helpers/pageContext'
import type { I18nConfig } from '../lib/core/types'

// ── helpers ──────────────────────────────────────────────────────────────────

const LOCALES_4 = ['en', 'ru', 'de', 'fr'] as const
const LOCALES_20 = [
  'en', 'ru', 'de', 'fr', 'es', 'it', 'pt', 'nl', 'pl', 'cs',
  'sk', 'hu', 'ro', 'bg', 'hr', 'sl', 'lt', 'lv', 'et', 'fi',
]
const LOCALES_50 = [
  ...LOCALES_20,
  'sv', 'da', 'no', 'is', 'el', 'tr', 'ar', 'he', 'zh', 'ja',
  'ko', 'th', 'vi', 'id', 'ms', 'uk', 'sr', 'mk', 'sq', 'ka',
  'az', 'hy', 'kk', 'uz', 'tk', 'mn', 'km', 'lo', 'my', 'si',
]

function makeLocaleMap(key: string, locales: readonly string[]): Record<string, string> {
  const map: Record<string, string> = {}
  for (const l of locales) map[l] = key
  return map
}

function makeRoutes(count: number, locales: readonly string[]): I18nConfig['routes'] {
  const routes: I18nConfig['routes'] = {}
  routes['/'] = makeLocaleMap('/', locales)
  for (let i = 0; i < count; i++) {
    const key = `/section-${i}/:id/detail`
    routes[key] = makeLocaleMap(key, locales)
  }
  return routes
}

// ── configs ───────────────────────────────────────────────────────────────────

const config4L6R: I18nConfig = {
  defaultLocale: 'en',
  locales: [...LOCALES_4],
  routes: {
    '/': { en: '/', ru: '/', de: '/', fr: '/' },
    '/about': { en: '/about', ru: '/o-nas', de: '/ueber-uns', fr: '/a-propos' },
    '/blog': { en: '/blog', ru: '/blog', de: '/blog', fr: '/blog' },
    '/blog/:slug': { en: '/blog/:slug', ru: '/blog/:slug', de: '/blog/:slug', fr: '/blog/:slug' },
    '/specialities/:speciality': {
      en: '/specialities/:speciality',
      ru: '/specialnosti/:speciality',
      de: '/fachgebiete/:speciality',
      fr: '/specialites/:speciality',
    },
    '/doctors/:id/profile': {
      en: '/doctors/:id/profile',
      ru: '/vrachi/:id/profil',
      de: '/aerzte/:id/profil',
      fr: '/medecins/:id/profil',
    },
  },
}

const config20L200R: I18nConfig = {
  defaultLocale: 'en',
  locales: [...LOCALES_20],
  routes: makeRoutes(200, LOCALES_20),
}

const config50L1000R: I18nConfig = {
  defaultLocale: 'en',
  locales: [...LOCALES_50],
  routes: makeRoutes(1000, LOCALES_50),
}

// ── suites ────────────────────────────────────────────────────────────────────

describe('useI18nRoute / localizePath — hot path (no options, no variants)', () => {
  const router = createTestRouter('http://localhost/en/about', config4L6R)

  bench('simple route, same locale', () => {
    router.localizePath('/about')
  })

  bench('simple route, other locale', () => {
    router.localizePath('/about', 'ru')
  })

  bench('100x simple route, other locale', () => {
    for (let i = 0; i < 100; i++) {
      router.localizePath('/about', 'ru')
    }
  })

  bench('route with params, other locale', () => {
    router.localizePath('/specialities/:speciality', 'ru', { params: { speciality: 'cardiology' } })
  })

  bench('100x route with params, other locale', () => {
    for (let i = 0; i < 100; i++) {
      router.localizePath('/specialities/:speciality', 'ru', { params: { speciality: 'cardiology' } })
    }
  })

  bench('deep route with params, other locale', () => {
    router.localizePath('/doctors/:id/profile', 'de', { params: { id: '42' } })
  })

  bench('100x deep route with params, other locale', () => {
    for (let i = 0; i < 100; i++) {
      router.localizePath('/doctors/:id/profile', 'de', { params: { id: '42' } })
    }
  })

  bench('route with query', () => {
    router.localizePath('/blog', 'fr', { query: { page: '2', sort: 'date' } })
  })

  bench('100x route with query', () => {
    for (let i = 0; i < 100; i++) {
      router.localizePath('/blog', 'fr', { query: { page: '2', sort: 'date' } })
    }
  })

  bench('all locales for one route', () => {
    router.localizePath('/about', 'en')
    router.localizePath('/about', 'ru')
    router.localizePath('/about', 'de')
    router.localizePath('/about', 'fr')
  })

  bench('100x all locales for one route', () => {
    for (let i = 0; i < 100; i++) {
      router.localizePath('/about', 'en')
      router.localizePath('/about', 'ru')
      router.localizePath('/about', 'de')
      router.localizePath('/about', 'fr')
    }
  })
})

describe('useI18nRoute / localizePath — 20 locales, 200 routes', () => {
  const router = createTestRouter('http://localhost/en/section-0/42/detail', config20L200R)

  bench('simple route lookup', () => {
    router.localizePath('/section-0/42/detail', 'ru')
  })

  bench('route at end of table', () => {
    router.localizePath('/section-199/42/detail', 'de')
  })

  bench('route with params, all 20 locales', () => {
    for (const l of LOCALES_20) {
      router.localizePath('/section-50/:id/detail', l, { params: { id: '7' } })
    }
  })

  bench('100x route with params, random locale', () => {
    for (let i = 0; i < 100; i++) {
      router.localizePath('/section-100/:id/detail', LOCALES_20[i % LOCALES_20.length], { params: { id: String(i) } })
    }
  })
})

describe('useI18nRoute / localizePath — 50 locales, 1000 routes', () => {
  const router = createTestRouter('http://localhost/en/section-0/42/detail', config50L1000R)

  bench('simple route lookup', () => {
    router.localizePath('/section-0/42/detail', 'ru')
  })

  bench('route at end of table', () => {
    router.localizePath('/section-999/42/detail', 'de')
  })

  bench('route with params, all 50 locales', () => {
    for (const l of LOCALES_50) {
      router.localizePath('/section-500/:id/detail', l, { params: { id: '7' } })
    }
  })

  bench('100x route with params, random locale', () => {
    for (let i = 0; i < 100; i++) {
      router.localizePath('/section-500/:id/detail', LOCALES_50[i % LOCALES_50.length], { params: { id: String(i) } })
    }
  })
})
