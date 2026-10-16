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

  // Writes the locale cookie on rendered pages (redirects set it in onBeforeRoute).
  // Vike resolves `import:` pointers for any config value, but only types them for hooks.
  headersResponse: 'import:vike-i18n-routing/__internal/headersResponse:headersResponse' as unknown as Config['headersResponse'],

  passToClient: ['locale', 'canonical', 'i18nRoute'],
} satisfies Config
