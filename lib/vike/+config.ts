import type { Config } from 'vike/types'

export default {
  name: 'vike-i18n-routing',

  meta: {
    i18n: {
      env: { server: true, client: true, config: true },
      global: true,
    },
    onServerRender: {
      env: { server: true },
    },
  },

  onBeforeRoute: 'import:vike-i18n-routing/__internal/onBeforeRoute:onBeforeRoute',
  onHydrationEnd: 'import:vike-i18n-routing/__internal/onHydrationEnd:onHydrationEnd',

  // Writes Set-Cookie via headersResponse (only available during render, not in onBeforeRoute)
  onBeforeRender: 'import:vike-i18n-routing/__internal/onBeforeRender:onBeforeRender',

  passToClient: ['locale', 'canonical', 'i18nParamVariants'],
} satisfies Config
