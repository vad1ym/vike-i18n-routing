import { compile, match } from 'path-to-regexp'

type RouteParams = Record<string, string | undefined>

type CompiledRoutePattern = {
  build: (params: RouteParams) => string
  match: (pathname: string) => RouteParams | null
}

const routePatternCache = new Map<string, CompiledRoutePattern>()

// Normalizes pathnames to a leading slash and trims trailing slashes except for root.
export function normalizePathname(pathname: string): string {
  if (!pathname || pathname === '/') return '/'
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`
  if (normalized.length <= 1) return normalized
  // Fast path: no trailing slash — skip regex
  if (normalized[normalized.length - 1] !== '/') return normalized
  // Trim trailing slashes
  let end = normalized.length - 1
  while (end > 0 && normalized[end] === '/') end--
  return normalized.slice(0, end + 1)
}

// Converts vike-style @param syntax to path-to-regexp :param syntax.
export function normalizeRoutePattern(pattern: string): string {
  return pattern.replaceAll('@', ':')
}

// Compiles and caches a route pattern for fast repeated match/build operations.
function getCompiledRoutePattern(pattern: string): CompiledRoutePattern {
  const normalizedPattern = normalizePathname(normalizeRoutePattern(pattern))
  const cached = routePatternCache.get(normalizedPattern)
  if (cached) return cached

  const matcher = match<Record<string, string | string[]>>(normalizedPattern, {
    decode: false,
  })
  const builder = compile(normalizedPattern, { encode: false })

  const compiled = {
    build(params: RouteParams) {
      const filteredParams = Object.fromEntries(
        Object.entries(params).filter(([, value]) => value != null),
      )

      return normalizePathname(builder(filteredParams))
    },
    match(pathname: string) {
      const result = matcher(normalizePathname(pathname))
      if (!result) return null

      return Object.fromEntries(
        Object.entries(result.params).map(([name, value]) => [
          name,
          Array.isArray(value) ? value.join('/') : value,
        ]),
      )
    },
  } satisfies CompiledRoutePattern

  routePatternCache.set(normalizedPattern, compiled)
  return compiled
}

// Builds a concrete pathname from a route pattern and params.
export function buildRoutePath(pattern: string, params: RouteParams): string {
  return getCompiledRoutePattern(pattern).build(params)
}

// Matches a pathname against a route pattern and returns extracted params.
export function matchRoutePattern(
  pattern: string,
  pathname: string,
): RouteParams | null {
  return getCompiledRoutePattern(pattern).match(pathname)
}
