const messages = {
  en: {
    layout: {
      brand: 'Static i18n example',
      home: 'Home',
      about: 'About',
      catalog: 'Catalog',
      switchLocale: 'Switch locale',
      badge: 'Pre rendered with generateStaticPaths',
    },
    home: {
      title: 'Static output with localized routes',
      body: 'This example pre renders localized HTML for static routes.',
      cta: 'Open the catalog',
    },
    about: {
      title: 'About',
      body: 'generateStaticPaths returns localized URLs for static route entries only.',
    },
    catalog: {
      title: 'Specialities catalog',
      body: 'This page is static and localized for every configured locale.',
    },
  },
  ru: {
    layout: {
      brand: 'Статический пример',
      home: 'Главная',
      about: 'О нас',
      catalog: 'Каталог',
      switchLocale: 'Сменить язык',
      badge: 'Предрендер через generateStaticPaths',
    },
    home: {
      title: 'Статический вывод с локализованными маршрутами',
      body: 'Этот пример заранее генерирует локализованный HTML только для статических маршрутов.',
      cta: 'Открыть каталог',
    },
    about: {
      title: 'О нас',
      body: 'generateStaticPaths возвращает локализованные URL только для статических маршрутов.',
    },
    catalog: {
      title: 'Каталог специальностей',
      body: 'Эта страница статическая и локализуется для каждой настроенной локали.',
    },
  },
} as const

export function getMessages(locale: string) {
  return messages[locale as keyof typeof messages] ?? messages.en
}
