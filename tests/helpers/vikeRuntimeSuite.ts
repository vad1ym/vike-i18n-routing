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

    it('serializes runtime param and query variants through Vike passToClient', async () => {
      const response = await runtime.request('/services/web-development?focus=frontend')

      expect(response.status).toBe(200)
      expect(response.body).toContain('Services runtime fixture')
      expect(response.body).toContain('i18nParamVariants')
      expect(response.body).toContain('veb-razrabotka')
      expect(response.body).toContain('i18nQueryVariants')
      expect(response.body).toContain('frontend-ru')
      expect(response.body).toContain('/services/web-development?focus=frontend')
    })
  })
}
