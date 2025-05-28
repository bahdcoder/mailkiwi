import { appEnv } from '#root/core/app/env/app_env.js'
import { type ServerType, serve } from '@hono/node-server'

import { makeApp, makeLogger } from '#root/core/shared/container/index.js'

import { sleep } from '#root/core/utils/sleep.js'

export async function createTestServer() {
  const app = makeApp()
  const logger = makeLogger()

  const server = serve(
    {
      fetch: app.fetch,
      port: appEnv.PORT + 100,
    },
    ({ address, port }) => {
      logger.info(`@inject-tests: monolith api running on: ${address}:${port}`)
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
  const logger = makeLogger()

  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) return reject(error)

      logger.info('@inject-tests: monolith api closed.')

      resolve({})
    })
  })

  await sleep(1000)
}
