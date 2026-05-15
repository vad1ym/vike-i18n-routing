import { For, createMemo, type JSX } from 'solid-js'
import { usePageContext } from 'vike-solid/usePageContext'
import { useI18nRoute } from 'vike-i18n-routing/solid'
import { createTranslator } from '../i18n'

export { Layout }

function Layout(props: { children: JSX.Element }) {
  const pageContext = usePageContext()
  const { locale, localeConfig, routeConfig, localizePath } = useI18nRoute(pageContext)
  const locales = createMemo(() => Object.keys(localeConfig().locales))
  const t = createTranslator(locale)

  function switchLocale(nextLocale: string) {
    return localizePath(routeConfig().canonicalUrl, nextLocale, { prefix: true })
  }

  return (
    <div style={layoutStyle}>
      <header style={headerStyle}>
        <div>
          <a href={localizePath('/')} style={brandStyle}>
            {t('layout.brand')}
          </a>
        </div>

        <nav style={navStyle}>
          <a href={localizePath('/')}>{t('layout.home')}</a>
          <a href={localizePath('/about')}>{t('layout.about')}</a>
          <a href={localizePath('/specialities')}>{t('layout.specialities')}</a>
        </nav>

        <nav aria-label={t('layout.switchLocale')} style={navStyle}>
          <For each={locales()}>
            {(supportedLocale) => (
              <a
                href={switchLocale(supportedLocale)}
                style={supportedLocale === locale() ? activeLocaleStyle : undefined}
              >
                {supportedLocale.toUpperCase()}
              </a>
            )}
          </For>
        </nav>
      </header>

      <main style={contentStyle}>{props.children}</main>

      <footer>
        <pre>{JSON.stringify(routeConfig(), null, 2)}</pre>
      </footer>
    </div>
  )
}

const layoutStyle = {
  'max-width': '960px',
  margin: '0 auto',
  padding: '24px',
  'font-family': '"Helvetica Neue", Arial, sans-serif',
}

const headerStyle = {
  display: 'flex',
  'flex-wrap': 'wrap',
  'align-items': 'center',
  'justify-content': 'space-between',
  gap: '16px',
  'padding-bottom': '16px',
  'margin-bottom': '24px',
  'border-bottom': '1px solid #d4d4d8',
}

const brandStyle = {
  color: 'inherit',
  'font-size': '20px',
  'font-weight': 700,
  'text-decoration': 'none',
}

const navStyle = {
  display: 'flex',
  'flex-wrap': 'wrap',
  gap: '12px',
}

const activeLocaleStyle = {
  'font-weight': 700,
  'text-decoration': 'none',
}

const contentStyle = {
  display: 'grid',
  gap: '16px',
}
