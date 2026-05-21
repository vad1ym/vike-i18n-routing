import { describe, it, expect } from 'vitest'
import { getCanonicalLink, getHreflangLinks, getSeoLinks } from '../lib/core/seo'

const alternates = [
  { locale: 'en', url: '/en/about' },
  { locale: 'ru', url: '/ru/o-nas' },
  { locale: 'de', url: '/de/ueber-uns' },
]

describe('getCanonicalLink', () => {
  it('returns href object', () => {
    expect(getCanonicalLink('/en/about')).toEqual({ href: '/en/about' })
  })
})

describe('getHreflangLinks', () => {
  it('returns one entry per locale', () => {
    const links = getHreflangLinks(alternates, 'en')
    expect(links).toContainEqual({ hreflang: 'en', href: '/en/about' })
    expect(links).toContainEqual({ hreflang: 'ru', href: '/ru/o-nas' })
    expect(links).toContainEqual({ hreflang: 'de', href: '/de/ueber-uns' })
  })

  it('adds x-default pointing to default locale URL', () => {
    const links = getHreflangLinks(alternates, 'en')
    expect(links).toContainEqual({ hreflang: 'x-default', href: '/en/about' })
  })

  it('x-default points to correct locale when default is not en', () => {
    const links = getHreflangLinks(alternates, 'ru')
    expect(links).toContainEqual({ hreflang: 'x-default', href: '/ru/o-nas' })
  })

  it('does not add x-default when defaultLocale is not in alternateUrls', () => {
    const links = getHreflangLinks(alternates, 'fr')
    expect(links.filter((l) => l.hreflang === 'x-default')).toHaveLength(0)
  })

  it('returns exactly locale-count + 1 entries (with x-default)', () => {
    const links = getHreflangLinks(alternates, 'en')
    expect(links).toHaveLength(alternates.length + 1)
  })
})

describe('getSeoLinks', () => {
  it('returns both canonical and hreflang', () => {
    const { canonical, hreflang } = getSeoLinks(alternates, 'en', '/en/about')
    expect(canonical).toEqual({ href: '/en/about' })
    expect(hreflang).toContainEqual({ hreflang: 'x-default', href: '/en/about' })
    expect(hreflang).toHaveLength(alternates.length + 1)
  })
})
