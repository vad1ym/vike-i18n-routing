import { useIntl } from 'react-intl'
import { useData } from 'vike-react/useData'
import { usePageContext } from 'vike-react/usePageContext'

export { Page }

type PageData = {
  speciality: string
  description: string
}

function Page() {
  const intl = useIntl()
  const data = useData<PageData>()
  const pageContext = usePageContext()

  return (
    <div>
      <h1>{intl.formatMessage({ id: 'speciality.title' }, { speciality: data.speciality })}</h1>
      <p>{data.description}</p>
      <p>
        {intl.formatMessage({ id: 'speciality.currentUrl' })}{' '}
        <code>{pageContext.i18nRoute.currentLocaleUrl}</code>
      </p>

      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}
