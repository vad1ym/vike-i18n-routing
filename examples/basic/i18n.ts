import { createI18n } from 'vue-i18n'

export const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    en: {
      layout: {
        brand: 'Vike i18n routing',
        home: 'Home',
        about: 'About',
        specialities: 'Specialities',
        frontend: 'Frontend',
        backend: 'Backend',
        switchLocale: 'Switch locale',
      },
      home: {
        title: 'Home',
        currentLocale: 'Current locale: {locale}',
        tryDynamicList: 'Open the specialities list:',
      },
      about: {
        title: 'About',
        body: 'This page uses vue-i18n for basic text localization.',
      },
      speciality: {
        title: 'Speciality: {speciality}',
        source: 'Dynamic route param comes from pages/specialities/@speciality/+Page.vue.',
        currentUrl: 'Current localized URL:',
      },
      specialities: {
        title: 'Specialities',
        body: 'A mock list loaded from +data with localized slug params and a translated query filter.',
        filters: {
          all: 'All',
          frontend: 'Frontend',
          backend: 'Backend',
        },
      },
    },
    ru: {
      layout: {
        brand: 'Vike i18n routing',
        home: 'Главная',
        about: 'О нас',
        specialities: 'Специальности',
        frontend: 'Фронтенд',
        backend: 'Бэкенд',
        switchLocale: 'Сменить язык',
      },
      home: {
        title: 'Главная',
        currentLocale: 'Текущая локаль: {locale}',
        tryDynamicList: 'Открыть список специальностей:',
      },
      about: {
        title: 'О нас',
        body: 'Эта страница использует vue-i18n для базовой локализации текста.',
      },
      speciality: {
        title: 'Специальность: {speciality}',
        source: 'Динамический параметр маршрута приходит из pages/specialities/@speciality/+Page.vue.',
        currentUrl: 'Текущий локализованный URL:',
      },
      specialities: {
        title: 'Специальности',
        body: 'Мок-список из +data с локализованными slug-параметрами и переводимым query-фильтром.',
        filters: {
          all: 'Все',
          frontend: 'Фронтенд',
          backend: 'Бэкенд',
        },
      },
    },
  },
})
