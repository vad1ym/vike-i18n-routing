import { useData } from 'vike-solid/useData'
import { usePageContext } from 'vike-solid/usePageContext'
import { useI18nRoute } from 'vike-i18n-routing/solid'
import { createTranslator } from '../../../i18n'

export { Page }

type PageData = {
  speciality: string
  description: string
}

function Page() {
  const data = useData<PageData>()
  const pageContext = usePageContext()
  const { locale } = useI18nRoute(pageContext)
  const t = createTranslator(locale)

  return (
    <div>
      <h1>{t('speciality.title', { speciality: data.speciality })}</h1>
      <p>{data.description}</p>
      <p>
        {t('speciality.currentUrl')} <code>{pageContext.i18nRoute.routeConfig.currentLocaleUrl}</code>
      </p>

      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}
