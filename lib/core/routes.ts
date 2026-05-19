import { normalizePathname } from './route-patterns'
import type { FlatI18nRoutes, I18nRouteLeaf, I18nRoutes } from './types'

function isRouteLeaf(value: I18nRouteLeaf | I18nRoutes): value is I18nRouteLeaf {
  const entries = Object.entries(value)
  return entries.length > 0 && entries.every(([, nestedValue]) => typeof nestedValue === 'string')
}

function joinRoutePath(prefix: string, childKey: string): string {
  if (prefix === '/') return normalizePathname(childKey)
  if (childKey === '/') return normalizePathname(prefix)
  return normalizePathname(`${prefix}/${childKey.slice(1)}`)
}

function prefixLocalizedPatterns(
  parentPath: string,
  localizedPatterns: I18nRouteLeaf,
): I18nRouteLeaf {
  if (!parentPath) return localizedPatterns

  return Object.fromEntries(
    Object.entries(localizedPatterns).map(([locale, path]) => [
      locale,
      joinRoutePath(parentPath, path),
    ]),
  )
}

function flattenRouteTree(
  routes: I18nRoutes,
  parentPath = '',
  result: FlatI18nRoutes = {},
): FlatI18nRoutes {
  for (const [routeKey, value] of Object.entries(routes)) {
    const fullPath = parentPath
      ? joinRoutePath(parentPath, routeKey)
      : normalizePathname(routeKey)

    if (isRouteLeaf(value)) {
      result[fullPath] = prefixLocalizedPatterns(parentPath, value)
      continue
    }

    flattenRouteTree(value, fullPath, result)
  }

  return result
}

export function normalizeRoutes(routes: I18nRoutes): FlatI18nRoutes {
  return flattenRouteTree(routes)
}
