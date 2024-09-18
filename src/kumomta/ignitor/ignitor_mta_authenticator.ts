import { DkimController } from "@/kumomta/controllers/dkim_controller.js"
import { SmtpAuthController } from "@/kumomta/controllers/smtp_auth_controller.js"
import { HonoMtaAuthenticator } from "@/kumomta/server/hono_mta_authenticator.js"
import { serve } from "@hono/node-server"
import type { Redis } from "ioredis"

import { ContainerKey } from "@/shared/container/index.ts"
import { EnvVariables, env } from "@/shared/env/index.ts"
import { HonoInstance } from "@/shared/server/hono.ts"

import { createRedisDatabaseInstance } from "@/redis/redis_client.ts"

import { container } from "@/utils/typi.ts"

export class IgnitorMtaAuthenticator {
  protected app: HonoInstance
  protected redis: Redis
  protected env: EnvVariables

  boot() {
    this.env = env
    container.register(ContainerKey.env, this.env)

    this.redis = createRedisDatabaseInstance(this.env.REDIS_URL)
    container.register(ContainerKey.redis, this.redis)

    this.app = new HonoMtaAuthenticator()
    container.register(ContainerKey.mtaAuthenticatorApp, this.app)

    container.resolve(DkimController)
    container.resolve(SmtpAuthController)

    return this
  }

  async startHttpServer() {
    serve({
      fetch: this.app.fetch,
      port: this.env.MTA_AUTHENTICATOR_PORT,
    })

    console.log(
      `MTA Authenticator: 🌐 http://${this.env.HOST}:${this.env.MTA_AUTHENTICATOR_PORT}`,
    )
  }

  async start() {
    await this.startHttpServer()
  }
}
