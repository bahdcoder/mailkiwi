import { DkimController } from "@/kumo/controllers/dkim_controller.ts"
import { SmtpAuthController } from "@/kumo/controllers/smtp_auth_controller.ts"
import { serve } from "@hono/node-server"
import type { Redis } from "ioredis"

import { HonoInstance } from "@/server/hono.ts"
import { HonoMta } from "@/server/hono_mta_helper.ts"

import { ContainerKey } from "@/shared/container/index.ts"
import { EnvVariables, env } from "@/shared/env/index.ts"

import { createRedisDatabaseInstance } from "@/redis/redis_client.ts"

import { container } from "@/utils/typi.ts"

export class IgnitorMtaHelper {
  protected app: HonoInstance
  protected redis: Redis
  protected env: EnvVariables

  boot() {
    this.env = env
    this.app = new HonoMta()
    this.redis = createRedisDatabaseInstance(this.env.REDIS_URL)

    container.register(ContainerKey.env, this.env)
    container.register(ContainerKey.redis, this.redis)
    container.register(ContainerKey.mtaHelperApp, this.app)

    container.resolve(DkimController)
    container.resolve(SmtpAuthController)

    return this
  }

  async startHttpServer() {
    serve({
      fetch: this.app.fetch,
      port: this.env.PORT,
    })

    console.log(`MTA Helper: 🌐 http://${this.env.HOST}:${this.env.PORT}`)
  }

  async start() {
    await this.startHttpServer()
  }
}
