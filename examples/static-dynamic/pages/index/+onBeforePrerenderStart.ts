import { generateStaticPaths } from 'vike-i18n-routing'
import { loadDummyJsonProducts } from '../../dummyjsonProducts'
import { i18nConfig } from '../../i18nConfig'

export { onBeforePrerenderStart }

async function onBeforePrerenderStart() {
  const products = await loadDummyJsonProducts()

  return await generateStaticPaths(i18nConfig, {
    routeParams: {
      '/products/:slug': products.map((product) => ({
        slug: product.slug,
      })),
    },
  })
}
