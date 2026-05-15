import { usePageContext } from 'vike-solid/usePageContext'
import { useI18nRoute } from 'vike-i18n-routing/solid'
import { createTranslator } from '../../i18n'

export { Page }

function Page() {
  const { locale, localizePath } = useI18nRoute(usePageContext())
  const t = createTranslator(locale)

  return (
    <div>
      <h1>{t('home.title')}</h1>
      <p>{t('home.currentLocale', { locale: locale() })}</p>
      <p>
        {t('home.tryDynamicList')}{' '}
        <a href={localizePath('/specialities', locale())}>
          {t('layout.specialities')}
        </a>
      </p>
    </div>
  )
}
