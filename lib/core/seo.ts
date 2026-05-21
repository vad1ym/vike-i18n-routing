import type { AlternateUrl, LocaleCode } from './types'

export type HreflangLink = {
  hreflang: string
  href: string
}

export type CanonicalLink = {
  href: string
}

export type SeoLinks = {
  canonical: CanonicalLink
  hreflang: HreflangLink[]
}

/**
 * Returns a `{ href }` object for the `<link rel="canonical">` tag.
 *
 * @example
 * const { href } = getCanonicalLink(defaultLocaleUrl)
 * // <link rel="canonical" href={href} />
 */
export function getCanonicalLink(canonicalUrl: string): CanonicalLink {
  return { href: canonicalUrl }
}

/**
 * Returns an array of `{ hreflang, href }` objects for `<link rel="alternate" hreflang>` tags,
 * including an `x-default` entry pointing to the default locale URL.
 *
 * @param alternateUrls - from `useI18nRoute().alternateUrls`
 * @param defaultLocale - the site's default locale; this entry is also used as `x-default`
 *
 * @example
 * const links = getHreflangLinks(alternateUrls, 'en')
 * // [
 * //   { hreflang: 'en', href: '/en/about' },
 * //   { hreflang: 'ru', href: '/ru/o-nas' },
 * //   { hreflang: 'x-default', href: '/en/about' },
 * // ]
 */
export function getHreflangLinks(
  alternateUrls: AlternateUrl[],
  defaultLocale: LocaleCode,
): HreflangLink[] {
  const links: HreflangLink[] = alternateUrls.map(({ locale, url }) => ({
    hreflang: locale,
    href: url,
  }))

  const defaultEntry = alternateUrls.find((a) => a.locale === defaultLocale)
  if (defaultEntry) {
    links.push({ hreflang: 'x-default', href: defaultEntry.url })
  }

  return links
}

/**
 * Convenience helper that returns both `canonical` and `hreflang` links in one call.
 *
 * @param alternateUrls - from `useI18nRoute().alternateUrls`
 * @param defaultLocale - the site's default locale
 * @param canonicalUrl - typically `useI18nRoute().defaultLocaleUrl`
 *
 * @example
 * const { canonical, hreflang } = getSeoLinks(alternateUrls, 'en', defaultLocaleUrl)
 */
export function getSeoLinks(
  alternateUrls: AlternateUrl[],
  defaultLocale: LocaleCode,
  canonicalUrl: string,
): SeoLinks {
  return {
    canonical: getCanonicalLink(canonicalUrl),
    hreflang: getHreflangLinks(alternateUrls, defaultLocale),
  }
}
