import { usePageContext } from 'vike-solid/usePageContext'
import { useI18nRoute } from 'vike-i18n-routing/solid'
import { createTranslator } from '../../i18n'

export { Page }

function Page() {
  const { locale } = useI18nRoute(usePageContext())
  const t = createTranslator(locale)

  return (
    <div>
      <h1>{t('about.title')}</h1>
      <p>{t('about.body')}</p>
    </div>
  )
}
