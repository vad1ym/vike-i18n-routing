import { createI18nRouter, setRouteSlugVariants } from './router'
import type {
  DetectorContext,
  I18nConfig,
  LocaleCode,
  LocalizedPathOptions,
  ResolveRouteOptions,
} from './types'

export { setRouteSlugVariants }

// Resolves an incoming pathname to locale, canonical route, and redirect metadata.
export function resolveI18nRoute(
  pathname: string,
  i18n: I18nConfig,
  options: ResolveRouteOptions,
) {
  return createI18nRouter(i18n).resolve(pathname, options)
}

// Resolves any pathname to its canonical route URL without locale prefixing.
export function resolveCanonical(
  pathname: string,
  i18n: I18nConfig,
  options: { context: DetectorContext },
): string {
  return createI18nRouter(i18n).resolveCanonical(pathname, options.context)
}

// Converts a canonical route key into the concrete localized pathname for a locale.
export function resolveLocalizedPath(
  routeKey: string,
  locale: LocaleCode,
  i18n: I18nConfig,
  context: DetectorContext,
  options?: LocalizedPathOptions,
): string {
  return createI18nRouter(i18n).resolveLocalizedPath(routeKey, locale, context, options)
}
