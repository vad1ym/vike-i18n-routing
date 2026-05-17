import { usePageContext } from 'vike-solid/usePageContext'
import { useI18nRoute } from 'vike-i18n-routing'
import { createTranslator } from '../../i18n'

export { Page }

function Page() {
  const pageContext = usePageContext()
  const { localizePath } = useI18nRoute(pageContext)
  const t = createTranslator(() => pageContext.locale)

  return (
    <div>
      <h1>{t('home.title')}</h1>
      <p>{t('home.currentLocale', { locale: pageContext.locale })}</p>
      <p>
        {t('home.tryDynamicList')}{' '}
        <a href={localizePath('/specialities', pageContext.locale)}>
          {t('layout.specialities')}
        </a>
      </p>
    </div>
  )
}
