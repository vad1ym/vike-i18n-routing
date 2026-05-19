import { normalizeLocales } from './locale/normalize'
import { normalizePathname, normalizeRoutePattern } from './route-patterns'
import { normalizeRoutes } from './routes'
import { validateI18nConfig } from './validate'
import type { I18nConfig, LocaleCode } from './types'

export async function generateStaticPaths(
  config: I18nConfig,
): Promise<string[]> {
  validateI18nConfig(config)

  if (config.domains) {
    console.warn(
      'generateStaticPaths() ignores config.domains. Static output for domain-based routing is not supported.',
    )
  }

  const locales = normalizeLocales(config.locales)
  const localeCodes = Object.keys(locales)
  const paths = new Set<string>()
  const prefixDefaultLocale = config.prefixDefaultLocale !== false
  const routes = normalizeRoutes(config.routes)

  for (const [canonicalPattern, localizedPatterns] of Object.entries(routes)) {
    const isDynamicRoute = normalizeRoutePattern(canonicalPattern).includes(':')

    if (!isDynamicRoute) {
      for (const locale of localeCodes) {
        const localizedPattern = localizedPatterns[locale] ?? canonicalPattern
        paths.add(
          localizeStaticPath(localizedPattern, locale, {
            defaultLocale: config.defaultLocale,
            prefixDefaultLocale,
            urlPrefix: locales[locale]?.urlPrefix ?? locale,
          }),
        )
      }

      continue
    }
    console.warn(
      `generateStaticPaths() currently supports only static routes. Dynamic route "${canonicalPattern}" was skipped.`,
    )
}

  return [...paths]
}

function localizeStaticPath(
  pathname: string,
  locale: LocaleCode,
  options: {
    defaultLocale: LocaleCode
    prefixDefaultLocale: boolean
    urlPrefix: string
  },
): string {
  const normalizedPath = normalizePathname(pathname)
  const shouldPrefix = locale !== options.defaultLocale || options.prefixDefaultLocale

  if (!shouldPrefix) return normalizedPath

  return normalizePathname(`/${options.urlPrefix}${normalizedPath}`)
}
