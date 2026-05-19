import type { PageContext } from 'vike/types'
import { findDummyJsonProductBySlug } from '../../../dummyjsonProducts'

export { data }

async function data(pageContext: PageContext) {
  const slug = pageContext.i18nRoute.routeConfig.i18nUrlParams.slug
  const product = await findDummyJsonProductBySlug(slug)
  const locale = (pageContext.locale ?? 'en') as 'en' | 'ru'

  if (!product) {
    return {
      missing: true,
      slug,
      title: slug,
      description: 'Unknown product',
      category: 'n/a',
      price: 'n/a',
      source: 'n/a',
    }
  }

  return {
    missing: false,
    slug: product.slug,
    title: product.title[locale],
    description: product.description[locale],
    category: product.category,
    price: product.price,
    source: product.source,
  }
}
