import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { startRuntimeServer, type RuntimeServer } from './vikeRuntime'

export function defineVikeRuntimeSuite(name: string, fixtureRoot: string) {
  let runtime: RuntimeServer

  beforeAll(async () => {
    runtime = await startRuntimeServer(
      path.resolve(process.cwd(), fixtureRoot),
    )
  }, 30_000)

  afterAll(async () => {
    await runtime.close()
  })

  describe(name, () => {
    it('renders localized route through real Vike runtime and writes locale cookie', async () => {
      const response = await runtime.request('/ru/o-nas', {
        headers: {
          'accept-language': 'ru',
        },
      })

      expect(response.status).toBe(200)
      expect(response.headers.get('set-cookie')).toContain('locale=ru')
      expect(response.body).toContain('About runtime fixture')
      expect(response.body).toContain('/ru/o-nas')
    })

    it('applies locale detection redirect through runtime middleware', async () => {
      const response = await runtime.request('/about?lang=ru')

      expect(response.status).toBe(302)
      expect(response.headers.get('location')).toBe('/ru/o-nas')
    })

    it('redirects the prefixed default locale to the clean url and sets the locale cookie', async () => {
      const response = await runtime.request('/en/about')

      expect(response.status).toBe(302)
      expect(response.headers.get('location')).toBe('/about')
      expect(response.headers.getSetCookie()).toEqual(['locale=en; Path=/; SameSite=Lax; HttpOnly'])
    })

    it('consumes an explicit locale query with a redirect that sets the locale cookie', async () => {
      const response = await runtime.request('/about?locale=en', {
        headers: { cookie: 'locale=ru' },
      })

      expect(response.status).toBe(302)
      expect(response.headers.get('location')).toBe('/about')
      expect(response.headers.getSetCookie()).toEqual(['locale=en; Path=/; SameSite=Lax; HttpOnly'])
    })

    it('sets the locale cookie on locale detection redirects', async () => {
      const response = await runtime.request('/about?lang=ru')

      expect(response.headers.getSetCookie()).toEqual(['locale=ru; Path=/; SameSite=Lax; HttpOnly'])
    })

    it('serves pageContext.json for client-side navigation without redirecting to itself', async () => {
      const response = await runtime.request('/ru/o-nas/index.pageContext.json')

      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toContain('application/json')
      expect(response.body).not.toContain('_urlRedirect')
      expect(response.body).toContain('"locale":"ru"')
    })

    it('redirects pageContext.json when the page URL needs a redirect', async () => {
      const response = await runtime.request('/about/index.pageContext.json?lang=ru')

      expect(response.status).toBe(200)
      expect(response.body).toContain('"_urlRedirect"')
      expect(response.body).toContain('/ru/o-nas')
    })

    it('serializes runtime param and query variants through Vike passToClient', async () => {
      const response = await runtime.request('/services/web-development?focus=frontend')

      expect(response.status).toBe(200)
      expect(response.body).toContain('Services runtime fixture')
      expect(response.body).toContain('veb-razrabotka')
      expect(response.body).toContain('frontend-ru')
      expect(response.body).not.toContain('i18nParamVariants')
      expect(response.body).toContain('/services/web-development?focus=frontend')
    })
  })
}
