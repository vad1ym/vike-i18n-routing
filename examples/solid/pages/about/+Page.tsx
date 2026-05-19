import { usePageContext } from 'vike-solid/usePageContext'
import { createTranslator } from '../../i18n'

export { Page }

function Page() {
  const pageContext = usePageContext()
  const t = createTranslator(() => pageContext.locale)

  return (
    <div>
      <h1>{t('about.title')}</h1>
      <p>{t('about.body')}</p>
    </div>
  )
}
