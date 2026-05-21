import type { ReactNode } from 'react'
import { usePageContext } from 'vike-react/usePageContext'

export { Layout }

function Layout({ children }: { children: ReactNode }) {
  const pageContext = usePageContext()

  return (
    <div>
      <header>
        <h1>Runtime Fixture</h1>
        <code>{pageContext.i18nRoute.currentLocaleUrl}</code>
      </header>
      <main>{children}</main>
      <script
        id="route-state"
        type="application/json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(pageContext.i18nRoute),
        }}
      />
    </div>
  )
}
