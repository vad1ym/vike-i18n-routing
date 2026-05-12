import type { DetectorContext, I18nConfig } from '../types'

// Resolves the current domain from a custom detector, explicit context, or request host.
export function detectDomain(context: DetectorContext, i18n: I18nConfig): string | undefined {
  const custom = i18n.domainDetector?.(context)
  if (custom) return custom.toLowerCase()
  if (context.domain) return context.domain.toLowerCase()

  const hostHeader = context.headers.host
  const host = Array.isArray(hostHeader) ? hostHeader[0] : hostHeader
  if (host) return host.split(':')[0].toLowerCase()

  try {
    return new URL(context.url, 'http://localhost').hostname.toLowerCase() || undefined
  } catch {
    return undefined
  }
}
