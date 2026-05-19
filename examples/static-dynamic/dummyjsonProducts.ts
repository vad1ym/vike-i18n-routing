export type DummyJsonProduct = {
  id: number
  slug: string
  category: string
  price: number
  source: string
  title: {
    en: string
    ru: string
  }
  description: {
    en: string
    ru: string
  }
}

const products: DummyJsonProduct[] = [
  {
    id: 1,
    slug: 'essence-mascara-lash-princess',
    category: 'beauty',
    price: 9.99,
    source: 'DummyJSON sample products',
    title: {
      en: 'Essence Mascara Lash Princess',
      ru: 'Тушь Essence Lash Princess',
    },
    description: {
      en: 'A compact beauty sample used here to demonstrate prerendered dynamic routes.',
      ru: 'Компактный beauty-товар, который здесь используется для демонстрации предрендера динамических маршрутов.',
    },
  },
  {
    id: 2,
    slug: 'eyeshadow-palette-with-mirror',
    category: 'beauty',
    price: 19.99,
    source: 'DummyJSON sample products',
    title: {
      en: 'Eyeshadow Palette with Mirror',
      ru: 'Палетка теней с зеркалом',
    },
    description: {
      en: 'A small sample record showing how one canonical slug can be prerendered in every locale.',
      ru: 'Небольшая запись-пример, показывающая, как один canonical slug может быть заранее сгенерирован для каждой локали.',
    },
  },
  {
    id: 3,
    slug: 'powder-canister',
    category: 'beauty',
    price: 14.99,
    source: 'DummyJSON sample products',
    title: {
      en: 'Powder Canister',
      ru: 'Баночка с пудрой',
    },
    description: {
      en: 'Included as a third route so the example covers a small but realistic dynamic set.',
      ru: 'Добавлена как третий маршрут, чтобы пример покрывал небольшой, но реалистичный набор динамических страниц.',
    },
  },
]

export async function loadDummyJsonProducts() {
  return products
}

export async function findDummyJsonProductBySlug(slug: string) {
  const items = await loadDummyJsonProducts()
  return items.find((product) => product.slug === slug) ?? null
}
