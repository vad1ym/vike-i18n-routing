import { createDevMiddleware, renderPage } from 'vike/server'

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

// Each test file runs in its own worker (vitest isolates files by default), so vike's
// global context is fresh per fixture and doesn't need resetting between runs.
export async function startRuntimeServer(root: string): Promise<RuntimeServer> {
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
    },
  }
}
