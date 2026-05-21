import type { ReactNode } from 'react'
import { IntlProvider, useIntl } from 'react-intl'
import { usePageContext } from 'vike-react/usePageContext'
import { useI18nRoute } from 'vike-i18n-routing'
import { messages } from '../messages'

export { Layout }

function Layout({ children }: { children: ReactNode }) {
  const pageContext = usePageContext()
  const locale = (pageContext.locale ?? 'en') as keyof typeof messages

  return (
    <IntlProvider locale={locale} messages={messages[locale]} defaultLocale="en">
      <LayoutContent>{children}</LayoutContent>
    </IntlProvider>
  )
}

function LayoutContent({ children }: { children: ReactNode }) {
  const intl = useIntl()
  const pageContext = usePageContext()
  const { i18nRoute, localizePath, switchLocaleUrl } = useI18nRoute(pageContext)
  const locales = pageContext.i18nRoute.locales

  function switchLocale(nextLocale: string) {
    return switchLocaleUrl(nextLocale)
  }

  return (
    <div style={layoutStyle}>
      <header style={headerStyle}>
        <div>
          <a href={localizePath('/')} style={brandStyle}>
            {intl.formatMessage({ id: 'layout.brand' })}
          </a>
        </div>

        <nav style={navStyle}>
          <a href={localizePath('/')}>{intl.formatMessage({ id: 'layout.home' })}</a>
          <a href={localizePath('/about')}>{intl.formatMessage({ id: 'layout.about' })}</a>
          <a href={localizePath('/specialities')}>{intl.formatMessage({ id: 'layout.specialities' })}</a>
        </nav>

        <nav aria-label={intl.formatMessage({ id: 'layout.switchLocale' })} style={navStyle}>
          {locales.map((supportedLocale) => (
            <a
              key={supportedLocale}
              href={switchLocale(supportedLocale)}
              style={supportedLocale === pageContext.locale ? activeLocaleStyle : undefined}
            >
              {supportedLocale.toUpperCase()}
            </a>
          ))}
        </nav>
      </header>

      <main style={contentStyle}>{children}</main>

      <footer>
        <pre>{JSON.stringify(i18nRoute, null, 2)}</pre>
      </footer>
    </div>
  )
}

const layoutStyle = {
  maxWidth: '960px',
  margin: '0 auto',
  padding: '24px',
  fontFamily: '"Helvetica Neue", Arial, sans-serif',
}

const headerStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '16px',
  paddingBottom: '16px',
  marginBottom: '24px',
  borderBottom: '1px solid #d4d4d8',
} as const

const brandStyle = {
  color: 'inherit',
  fontSize: '20px',
  fontWeight: 700,
  textDecoration: 'none',
}

const navStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '12px',
} as const

const activeLocaleStyle = {
  fontWeight: 700,
  textDecoration: 'none',
}

const contentStyle = {
  display: 'grid',
  gap: '16px',
}
