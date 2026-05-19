import type { JSX } from 'solid-js'
import { usePageContext } from 'vike-solid/usePageContext'
import { useI18nRoute } from 'vike-i18n-routing'
import type { LocaleCode, LocalizedPathOptions } from 'vike-i18n-routing'

type LinkProps = Omit<JSX.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  to: string
  locale?: LocaleCode
  params?: Record<string, string>
  query?: Record<string, string>
  absolute?: boolean
  prefix?: boolean
}

export function Link(props: LinkProps) {
  const { to, locale, params, query, absolute, prefix, children, ...rest } = props
  const pageContext = usePageContext()
  const { localizePath } = useI18nRoute(pageContext)

  const options: LocalizedPathOptions = {}
  if (params) options.params = params
  if (query) options.query = query
  if (absolute !== undefined) options.absolute = absolute
  if (prefix !== undefined) options.prefix = prefix

  const href = localizePath(to, locale, Object.keys(options).length ? options : undefined)

  return <a href={href} {...rest}>{children}</a>
}
