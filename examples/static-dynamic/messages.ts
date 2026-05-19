const messages = {
  en: {
    layout: {
      brand: 'Static dynamic example',
      badge: 'Dynamic prerender with generateStaticPaths',
      home: 'Home',
      about: 'About',
      products: 'Products',
      switchLocale: 'Switch locale',
    },
    home: {
      title: 'Pre rendered dynamic product pages',
      body: 'This example generates localized static HTML for a small DummyJSON-style product selection.',
      cta: 'Open products',
    },
    about: {
      title: 'About this example',
      body: 'Dynamic paths are produced by generateStaticPaths(routeParams) during prerender.',
    },
    products: {
      title: 'Products',
      body: 'A tiny curated sample inspired by DummyJSON.',
      price: 'Price',
      category: 'Category',
      cta: 'Open product',
    },
    product: {
      back: 'Back to catalog',
      price: 'Price',
      category: 'Category',
      source: 'Source',
    },
  },
  ru: {
    layout: {
      brand: 'Статический dynamic пример',
      badge: 'Предрендер динамических страниц через generateStaticPaths',
      home: 'Главная',
      about: 'О проекте',
      products: 'Товары',
      switchLocale: 'Сменить язык',
    },
    home: {
      title: 'Предрендер динамических товарных страниц',
      body: 'Этот пример генерирует локализованный статический HTML для небольшой выборки товаров в стиле DummyJSON.',
      cta: 'Открыть товары',
    },
    about: {
      title: 'Об этом примере',
      body: 'Динамические URL создаются через generateStaticPaths(routeParams) во время prerender.',
    },
    products: {
      title: 'Товары',
      body: 'Небольшая локальная выборка, вдохновлённая DummyJSON.',
      price: 'Цена',
      category: 'Категория',
      cta: 'Открыть товар',
    },
    product: {
      back: 'Назад в каталог',
      price: 'Цена',
      category: 'Категория',
      source: 'Источник',
    },
  },
} as const

export function getMessages(locale: string) {
  return messages[locale as keyof typeof messages] ?? messages.en
}
