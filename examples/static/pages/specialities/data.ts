export type SpecialityRecord = {
  title: {
    en: string
    ru: string
  }
  description: {
    en: string
    ru: string
  }
}

export const specialities: SpecialityRecord[] = [
  {
    title: {
      en: 'Web Development',
      ru: 'Веб-разработка',
    },
    description: {
      en: 'Builds interfaces, APIs, and production web systems.',
      ru: 'Делает интерфейсы, API и продуктовые веб-системы.',
    },
  },
  {
    title: {
      en: 'Analytics',
      ru: 'Аналитика',
    },
    description: {
      en: 'Turns product data into clear decisions and useful signals.',
      ru: 'Преобразует продуктовые данные в понятные решения и полезные сигналы.',
    },
  },
]
