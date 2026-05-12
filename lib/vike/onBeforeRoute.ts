import { redirect } from 'vike/abort'
import type { PageContextServer } from 'vike/types'
import { parseCookies, runLocaleDetector } from '../core/locale/detector'
import { resolveI18nRoute } from '../core/resolve'
import type { DetectorContext } from '../core/types'

// Vike route hook that resolves locale-aware routing before page matching.
export function onBeforeRoute(pageContext: PageContextServer) {
  const i18n = pageContext.config.i18n

  if (!i18n) {
    throw new Error('[vike-i18n] Missing config.i18n')
  }

  const url = pageContext.urlOriginal
  const parsedUrl = new URL(url, 'http://localhost')
  const headers = (pageContext as any).headers ?? {}

  const detectorContext: DetectorContext = {
    url,
    pathname: parsedUrl.pathname,
    headers,
    cookies: parseCookies(typeof headers.cookie === 'string' ? headers.cookie : ''),
    session: (pageContext as any).session,
    domain: typeof headers.host === 'string' ? headers.host.split(':')[0] : undefined,
    searchParams: parsedUrl.searchParams,
  }

  const setLocaleParam = parsedUrl.searchParams.get('setLocale')
  const detectedLocale = setLocaleParam ?? runLocaleDetector(detectorContext, i18n)
  const result = resolveI18nRoute(parsedUrl.pathname, i18n, {
    context: detectorContext,
    detectedLocale,
  })

  if (result.deferredRedirectTo && result.deferredRedirectTo !== parsedUrl.pathname) {
    const separator = result.deferredRedirectTo.includes('?') ? '&' : '?'
    throw redirect(`${result.deferredRedirectTo}${separator}setLocale=${result.locale}`)
  }

  if (result.redirectTo) {
    throw redirect(result.redirectTo)
  }

  return {
    pageContext: {
      urlPathname: result.canonical,
      canonical: result.canonical,
      locale: result.locale,
      i18nDomain: result.domain
        ? { domain: result.domain, meta: result.domainMeta }
        : undefined,
    } as Partial<Vike.PageContext> & { urlPathname: string },
  }
}
