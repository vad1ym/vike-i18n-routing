import { useIntl } from 'react-intl'
import { usePageContext } from 'vike-react/usePageContext'
import { useI18nRoute } from 'vike-i18n-routing/react'

export { Page }

function Page() {
  const intl = useIntl()
  const { locale, localizePath } = useI18nRoute(usePageContext())

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
