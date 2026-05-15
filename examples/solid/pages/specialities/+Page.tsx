import { For } from 'solid-js'
import { useData } from 'vike-solid/useData'
import { usePageContext } from 'vike-solid/usePageContext'
import { useI18nRoute } from 'vike-i18n-routing/solid'
import { createTranslator } from '../../i18n'
import type { SpecialityFocusFilter, SpecialityRecord } from './data'

export { Page }

type PageData = {
  activeFocus: string | null
  filters: SpecialityFocusFilter[]
  specialities: SpecialityRecord[]
}

function Page() {
  const data = useData<PageData>()
  const { locale, localizePath } = useI18nRoute(usePageContext())
  const t = createTranslator(locale)

  function filterHref(filter: PageData['filters'][number]) {
    return localizePath(`/specialities?focus=${filter.variants[locale()]}`)
  }

  return (
    <div>
      <h1>{t('specialities.title')}</h1>
      <p>{t('specialities.body')}</p>

      <div style={filtersStyle}>
        <a
          href={localizePath('/specialities')}
          style={data.activeFocus === null ? activeLinkStyle : undefined}
        >
          {t('specialities.filters.all')}
        </a>
        <For each={data.filters}>
          {(filter) => (
            <a
              href={filterHref(filter)}
              style={data.activeFocus === filter.key ? activeLinkStyle : undefined}
            >
              {t(`specialities.filters.${filter.key}` as 'specialities.filters.frontend' | 'specialities.filters.backend')}
            </a>
          )}
        </For>
      </div>

      <ul style={listStyle}>
        <For each={data.specialities}>
          {(item) => (
            <li>
              <a href={localizePath(`/specialities/${item.variants.speciality[locale()]}`)}>
                {item.title[locale() as 'en' | 'ru']}
              </a>
              <p>{item.description[locale() as 'en' | 'ru']}</p>
            </li>
          )}
        </For>
      </ul>
    </div>
  )
}

const filtersStyle = {
  display: 'flex',
  'flex-wrap': 'wrap',
  gap: '12px',
  'margin-bottom': '20px',
}

const activeLinkStyle = {
  'font-weight': 700,
  'text-decoration': 'none',
}

const listStyle = {
  display: 'grid',
  gap: '16px',
  padding: 0,
  'list-style': 'none',
}
