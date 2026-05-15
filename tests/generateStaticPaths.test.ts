import { afterEach, describe, expect, it, vi } from 'vitest'
import { generateStaticPaths } from '../lib/index'
import type { I18nConfig } from '../lib/core/types'
import { baseConfig } from './helpers/config'

describe('generateStaticPaths', () => {
  const staticConfig: I18nConfig = {
    ...baseConfig,
    routes: {
      '/': { en: '/', ru: '/' },
      '/about': { en: '/about', ru: '/o-nas' },
    },
  }

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('generates localized paths for static routes', async () => {
    const paths = await generateStaticPaths(staticConfig)

    expect(paths).toEqual([
      '/en',
      '/ru',
      '/en/about',
      '/ru/o-nas',
    ])
  })

  it('omits the default locale prefix when prefixDefaultLocale is false', async () => {
    const paths = await generateStaticPaths({
      ...staticConfig,
      prefixDefaultLocale: false,
    })

    expect(paths).toEqual([
      '/',
      '/ru',
      '/about',
      '/ru/o-nas',
    ])
  })

  it('skips dynamic routes and warns that they are not supported yet', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const paths = await generateStaticPaths(baseConfig)

    expect(paths).toEqual([
      '/en',
      '/ru',
      '/en/about',
      '/ru/o-nas',
    ])
    expect(warn).toHaveBeenCalledWith(
      'generateStaticPaths() currently supports only static routes. Dynamic route "/specialities/:speciality" was skipped.',
    )
  })

  it('warns when domains are configured and ignores them', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const configWithDomains: I18nConfig = {
      ...baseConfig,
      domains: {
        'site.com': {
          defaultLocale: 'en',
          locales: ['en'],
        },
      },
    }

    const paths = await generateStaticPaths(configWithDomains)

    expect(paths).toEqual([
      '/en',
      '/ru',
      '/en/about',
      '/ru/o-nas',
    ])
    expect(warn).toHaveBeenCalledWith(
      'generateStaticPaths() ignores config.domains. Static output for domain-based routing is not supported.',
    )
  })
})
