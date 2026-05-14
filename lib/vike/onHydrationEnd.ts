/**
 * Removes ?locale=<locale> from the URL after the server has handled it.
 * The server already sets the cookie via headersResponse on the /?locale=... render.
 */
export function onHydrationEnd() {
  const url = new URL(location.href)
  if (!url.searchParams.has('locale')) return

  url.searchParams.delete('locale')
  history.replaceState(null, '', url.pathname + url.search + url.hash)
}
