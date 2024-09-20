import { InjectEmailController } from "@/injector/controllers/inject_email_controller.ts"
import {
  InjectorEnvVariables,
  injectorEnv,
} from "@/injector/env/injector_env.js"
import { HonoMtaInjector } from "@/injector/server/hono_injector.ts"
import { serve } from "@hono/node-server"
import type { Redis } from "ioredis"

import { ContainerKey } from "@/shared/container/index.ts"
import { HonoInstance } from "@/shared/server/hono.ts"

import { createRedisDatabaseInstance } from "@/redis/redis_client.ts"

import { container } from "@/utils/typi.ts"

export class IgnitorMtaInjector {
  protected app: HonoInstance
  protected redis: Redis
  protected env: InjectorEnvVariables

  boot() {
    this.env = injectorEnv

    container.register(ContainerKey.env, this.env)

    this.redis = createRedisDatabaseInstance(this.env.REDIS_URL)
    container.register(ContainerKey.redis, this.redis)

    this.app = new HonoMtaInjector()
    container.register(ContainerKey.mtaInjectorApp, this.app)

    container.resolve(InjectEmailController)

    return this
  }

  async startHttpServer() {
    serve(
      {
        fetch: this.app.fetch,
        port: this.env.MTA_INJECTOR_PORT,
      },
      ({ address, port }) => {
        console.log(`MTA Injector: 🌐 http://${address}:${port}`)
      },
    )
  }

  async start() {
    await this.startHttpServer()
  }
}
