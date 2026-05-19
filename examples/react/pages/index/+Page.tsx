import { useIntl } from 'react-intl'
import { usePageContext } from 'vike-react/usePageContext'
import { useI18nRoute } from 'vike-i18n-routing'

export { Page }

function Page() {
  const intl = useIntl()
  const pageContext = usePageContext()
  const { localizePath } = useI18nRoute(pageContext)
  const locale = pageContext.locale

  return (
    <div>
      <h1>{intl.formatMessage({ id: 'home.title' })}</h1>
      <p>{intl.formatMessage({ id: 'home.currentLocale' }, { locale })}</p>
      <p>
        {intl.formatMessage({ id: 'home.tryDynamicList' })}{' '}
        <a href={localizePath('/specialities', locale)}>
          {intl.formatMessage({ id: 'layout.specialities' })}
        </a>
      </p>
    </div>
  )
}
