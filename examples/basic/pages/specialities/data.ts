export type SpecialityRecord = {
  slug: string
  focus: 'frontend' | 'backend'
  variants: {
    speciality: {
      en: string
      ru: string
    }
  }
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
    slug: 'web-development',
    focus: 'frontend',
    variants: {
      speciality: {
        en: 'web-development',
        ru: 'veb-razrabotka',
      },
    },
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
    slug: 'analytic',
    focus: 'backend',
    variants: {
      speciality: {
        en: 'analytic',
        ru: 'analitika',
      },
    },
    title: {
      en: 'Analytics',
      ru: 'Аналитика',
    },
    description: {
      en: 'Turns raw product data into decisions and measurable insights.',
      ru: 'Преобразует сырые продуктовые данные в решения и измеримые инсайты.',
    },
  },
]

export function findSpecialityBySlug(slug: string) {
  return specialities.find((item) =>
    slug === item.slug || Object.values(item.variants.speciality).includes(slug),
  )
}

export const specialityFocusFilters = [
  {
    key: 'frontend',
    variants: {
      en: 'frontend',
      ru: 'frontend-ru',
    },
  },
  {
    key: 'backend',
    variants: {
      en: 'backend',
      ru: 'backend-ru',
    },
  },
] as const

export function findSpecialityFocusBySlug(slug: string | null | undefined) {
  if (!slug) return undefined

  return specialityFocusFilters.find((item) =>
    slug === item.key || Object.values(item.variants).includes(slug),
  )
}
