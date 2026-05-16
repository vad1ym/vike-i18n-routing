import { onBeforeRender } from '../../lib/vike/onBeforeRender'
import { onBeforeRoute } from '../../lib/vike/onBeforeRoute'
import { createPageContext } from '../../lib/core/pageContext'
import { createI18nRouter } from '../../lib/core/router'
import { useI18nRoute } from '../../lib/core/useI18nRoute'
import type { I18nConfig } from '../../lib/core/types'

export function makePageContext(
  urlOriginal: string,
  i18n: I18nConfig,
  options?: {
    headers?: Record<string, string>
    session?: Record<string, string | undefined>
    localStorage?: Record<string, string | undefined>
  },
) {
  const urlPathname = new URL(urlOriginal, 'http://localhost').pathname

  return {
    urlOriginal,
    urlPathname,
    config: { i18n },
    headers: options?.headers,
    session: options?.session,
    localStorage: options?.localStorage,
  }
}

export function getRedirectUrl(error: unknown): string | null {
  if (
    error &&
    typeof error === 'object' &&
    '_pageContextAbort' in error &&
    '_isAbortError' in error
  ) {
    return (error as any)._pageContextAbort._urlRedirect?.url ?? null
  }
  return null
}

export function createTestRouter(url: string, config: I18nConfig) {
  const pageContext = createPageContext(url, { config: { i18n: config } })
  const i18nRouteData = createI18nRouter(new URL(url, 'http://localhost').pathname, pageContext)
  return useI18nRoute({ ...pageContext, i18nRoute: i18nRouteData })
}

export function resolveRenderRedirect(pageContext: ReturnType<typeof makePageContext>): string | null {
  try {
    const routeResult = onBeforeRoute(pageContext as any)
    onBeforeRender({
      ...pageContext,
      ...routeResult?.pageContext,
    } as any)
  } catch (error) {
    return getRedirectUrl(error)
  }

  return null
}
