import { useIntl } from 'react-intl'
import { useData } from 'vike-react/useData'
import { usePageContext } from 'vike-react/usePageContext'
import { useI18nRoute } from 'vike-i18n-routing'
import type { SpecialityFocusFilter, SpecialityRecord } from './data'

export { Page }

type PageData = {
  activeFocus: string | null
  filters: SpecialityFocusFilter[]
  specialities: SpecialityRecord[]
}

function Page() {
  const intl = useIntl()
  const data = useData<PageData>()
  const pageContext = usePageContext()
  const { localizePath } = useI18nRoute(pageContext)
  const locale = pageContext.locale

  function filterHref(filter: PageData['filters'][number]) {
    return localizePath(`/specialities?focus=${filter.variants[locale]}`)
  }

  return (
    <div>
      <h1>{intl.formatMessage({ id: 'specialities.title' })}</h1>
      <p>{intl.formatMessage({ id: 'specialities.body' })}</p>

      <div style={filtersStyle}>
        <a
          href={localizePath('/specialities')}
          style={data.activeFocus === null ? activeLinkStyle : undefined}
        >
          {intl.formatMessage({ id: 'specialities.filters.all' })}
        </a>
        {data.filters.map((filter) => (
          <a
            key={filter.key}
            href={filterHref(filter)}
            style={data.activeFocus === filter.key ? activeLinkStyle : undefined}
          >
            {intl.formatMessage({ id: `specialities.filters.${filter.key}` })}
          </a>
        ))}
      </div>

      <ul style={listStyle}>
        {data.specialities.map((item) => (
          <li key={item.slug}>
            <a href={localizePath(`/specialities/${item.variants.speciality[locale]}`)}>
              {item.title[locale]}
            </a>
            <p>{item.description[locale]}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

const filtersStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '12px',
  marginBottom: '20px',
} as const

const activeLinkStyle = {
  fontWeight: 700,
  textDecoration: 'none',
}

const listStyle = {
  display: 'grid',
  gap: '16px',
  padding: 0,
  listStyle: 'none',
} as const
