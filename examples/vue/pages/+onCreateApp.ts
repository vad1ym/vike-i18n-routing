import { i18n } from '../i18n'

export { onCreateApp }

function onCreateApp(pageContext: Vike.PageContext) {
  i18n.global.locale.value = pageContext.locale ?? 'en'
  pageContext.app.use(i18n)
}
