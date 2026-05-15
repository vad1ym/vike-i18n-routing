import { generateStaticPaths } from 'vike-i18n-routing'
import { i18nConfig } from '../../i18nConfig'

export { onBeforePrerenderStart }

async function onBeforePrerenderStart() {
  return await generateStaticPaths(i18nConfig)
}
