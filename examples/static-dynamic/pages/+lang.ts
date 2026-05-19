export { lang }

function lang(pageContext: Vike.PageContext) {
  return pageContext.locale ?? 'en'
}
