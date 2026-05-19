import { normalizeLocales } from './locale/normalize'
import { buildRoutePath, normalizePathname, normalizeRoutePattern } from './route-patterns'
import { normalizeRoutes } from './routes'
import { validateI18nConfig } from './validate'
import type {
  GenerateStaticPathsOptions,
  I18nConfig,
  LocaleCode,
  StaticRouteParams,
} from './types'

export async function generateStaticPaths(
  config: I18nConfig,
  options: GenerateStaticPathsOptions = {},
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
  const routeParams = options.routeParams ?? {}

  for (const routeKey of Object.keys(routeParams)) {
    if (routes[routeKey]) continue

    throw new Error(
      `[vike-i18n] generateStaticPaths() received params for unknown route key "${routeKey}".`,
    )
  }

  for (const [canonicalPattern, localizedPatterns] of Object.entries(routes)) {
    const isDynamicRoute = normalizeRoutePattern(canonicalPattern).includes(':')

    if (!isDynamicRoute) {
      for (const locale of localeCodes) {
        const localizedPattern = localizedPatterns[locale] ?? canonicalPattern
        paths.add(
          localizePathname(localizedPattern, locale, {
            defaultLocale: config.defaultLocale,
            prefixDefaultLocale,
            urlPrefix: locales[locale]?.urlPrefix ?? locale,
          }),
        )
      }

      continue
    }

    const paramsList = routeParams[canonicalPattern]
    if (!paramsList?.length) {
      console.warn(
        `generateStaticPaths() skipped dynamic route "${canonicalPattern}" because no routeParams were provided for it.`,
      )
      continue
    }

    for (const params of paramsList) {
      addDynamicLocalizedPaths(
        canonicalPattern,
        localizedPatterns,
        params,
        localeCodes,
        locales,
        paths,
        {
          defaultLocale: config.defaultLocale,
          prefixDefaultLocale,
        },
      )
    }
  }

  return [...paths]
}

function addDynamicLocalizedPaths(
  canonicalPattern: string,
  localizedPatterns: Record<string, string>,
  params: StaticRouteParams,
  localeCodes: string[],
  locales: Record<string, { urlPrefix: string }>,
  paths: Set<string>,
  options: {
    defaultLocale: LocaleCode
    prefixDefaultLocale: boolean
  },
) {
  for (const locale of localeCodes) {
    const localizedPattern = localizedPatterns[locale] ?? canonicalPattern

    let localizedPath: string
    try {
      localizedPath = buildRoutePath(localizedPattern, params)
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error)
      throw new Error(
        `[vike-i18n] generateStaticPaths() could not build route "${canonicalPattern}" for locale "${locale}" with params ${JSON.stringify(params)}: ${reason}`,
      )
    }

    paths.add(
      localizePathname(localizedPath, locale, {
        defaultLocale: options.defaultLocale,
        prefixDefaultLocale: options.prefixDefaultLocale,
        urlPrefix: locales[locale]?.urlPrefix ?? locale,
      }),
    )
  }
}

function localizePathname(
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
