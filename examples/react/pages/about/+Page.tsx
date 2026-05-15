import { useIntl } from 'react-intl'

export { Page }

function Page() {
  const intl = useIntl()

  return (
    <div>
      <h1>{intl.formatMessage({ id: 'about.title' })}</h1>
      <p>{intl.formatMessage({ id: 'about.body' })}</p>
    </div>
  )
}
