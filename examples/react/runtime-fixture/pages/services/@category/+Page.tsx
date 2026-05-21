import { useData } from 'vike-react/useData'
import { usePageContext } from 'vike-react/usePageContext'

export { Page }

type PageData = {
  requestedFocus: string | null
  currentUrl: string
}

function Page() {
  const data = useData<PageData>()
  const pageContext = usePageContext()

  return (
    <div>
      <p>Services runtime fixture</p>
      <code>{data.currentUrl}</code>
      <pre>{JSON.stringify(pageContext.i18nRoute.paramVariants)}</pre>
      <pre>{JSON.stringify(pageContext.i18nRoute.queryVariants)}</pre>
    </div>
  )
}
