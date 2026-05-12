import type { I18nConfig, LocaleCookieAction } from './types'

const DEFAULT_COOKIE_NAME = 'i18n-locale'

// Resolves the cookie write action for the current locale.
export function resolveCookieAction(
  locale: string,
  i18n: I18nConfig,
): LocaleCookieAction | null {
  if (i18n.localeCookie === false) return null

  return {
    name: i18n.localeCookie ?? DEFAULT_COOKIE_NAME,
    value: locale,
  }
}

// Serializes the locale cookie action into a Set-Cookie header value.
export function createSetCookieHeader(action: LocaleCookieAction): string {
  return `${action.name}=${encodeURIComponent(action.value)}; Path=/; SameSite=Lax; HttpOnly`
}
