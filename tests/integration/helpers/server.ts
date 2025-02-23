import { appEnv } from '@/app/env/app_env.js'
import { type ServerType, serve } from '@hono/node-server'

import { makeApp } from '@/shared/container/index.js'

import { sleep } from '@/utils/sleep.js'

export async function createTestServer() {
  const app = makeApp()

  const server = serve(
    {
      fetch: app.fetch,
      port: appEnv.PORT + 100,
    },
    ({ address, port }) => {
      console.log(`@inject-tests: monolith api running on: ${address}:${port}`)
    },
  )

  await new Promise((resolve, reject) => {
    server.on('listening', () => {
      resolve('Port listening.')
    })

    server.on('timeout', reject)
  })

  await sleep(1000)

  return server
}

export async function shutdownTestServer(server: ServerType) {
  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) return reject(error)

      console.log('@inject-tests: monolith api closed.')

      resolve({})
    })
  })

  await sleep(1000)
}
