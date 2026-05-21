import { createDevMiddleware } from 'vike/server'
import { renderPage } from 'vike/server'

export type RuntimeServer = {
  request: (urlOriginal: string, init?: {
    headers?: Record<string, string>
  }) => Promise<{
    status: number
    headers: Headers
    body: string
  }>
  close: () => Promise<void>
}

async function resetVikeGlobalContext() {
  const moduleUrl = new URL('../../node_modules/vike/dist/server/runtime/globalContext.js', import.meta.url)
  const { clearGlobalContext } = await import(/* @vite-ignore */ moduleUrl.href)
  clearGlobalContext()
}

export async function startRuntimeServer(root: string): Promise<RuntimeServer> {
  await resetVikeGlobalContext()

  const { viteServer } = await createDevMiddleware({
    root,
    viteConfig: {
      server: {
        hmr: false,
      },
    },
  })

  return {
    async request(urlOriginal, init) {
      const pageContext = await renderPage({
        urlOriginal,
        headersOriginal: {
          host: 'localhost',
          ...init?.headers,
        },
      })
      const { httpResponse } = pageContext

      return {
        status: httpResponse.statusCode,
        headers: new Headers(httpResponse.headers),
        body: await httpResponse.getBody(),
      }
    },
    async close() {
      await viteServer.close()
      await resetVikeGlobalContext()
    },
  }
}
