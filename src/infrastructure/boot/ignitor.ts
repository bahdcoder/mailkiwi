import "./globals"

import { PrismaClient } from "@prisma/client"
import Fastify, { FastifyInstance } from "fastify"
import { container } from "tsyringe"
import {
  createDatabaseClient,
  createDrizzleDatabase,
  DrizzleClient,
  runDatabaseMigrations,
} from "@/infrastructure/database/client.js"
import { count } from "drizzle-orm"
import { AudienceController } from "@/http/api/controllers/audiences/audience_controller.js"
import { ContactController } from "@/http/api/controllers/audiences/contact_controller.js"
import { AuthController } from "@/http/api/controllers/auth/auth_controller.js"
import { UserController } from "@/http/api/controllers/auth/user_controller.js"
import { MailerController } from "@/http/api/controllers/teams/mailer_controller.js"
import { MailerIdentityController } from "@/http/api/controllers/teams/mailer_identity_controller.js"
import { TeamController } from "@/http/api/controllers/teams/team_controller.js"
import { MailerWebhooksContorller } from "@/http/api/controllers/webhooks/mailer_webhooks_controller.js"
import { TeamMiddleware } from "@/http/api/middleware/audiences/team_middleware.js"
import { AccessTokenMiddleware } from "@/http/api/middleware/auth/access_token_middleware.js"
import { globalErrorHandler } from "@/http/responses/error_handler.js"
import { RootController } from "@/http/views/controllers/root_controller.js"
import { InstallationSettings } from "@/infrastructure/boot/installation_settings.js"
import { ContainerKey } from "@/infrastructure/container.js"
import {
  config,
  ConfigVariables,
  env,
  EnvVariables,
} from "@/infrastructure/env.js"

export class Ignitor {
  protected env: EnvVariables
  protected config: ConfigVariables
  protected app: FastifyInstance
  protected database: DrizzleClient

  boot() {
    this.env = env
    this.config = config

    this.bootHttpServer()
    this.bootDatabaseConnector()

    container.registerInstance(ContainerKey.app, this.app)
    container.registerInstance(ContainerKey.env, this.env)
    container.registerInstance(ContainerKey.config, this.config)

    return this
  }

  bootHttpServer() {
    this.app = Fastify({ logger: !this.env.isTest })

    const app = this.app

    if (this.env.isDevelopment) {
      this.app.addHook("onRoute", ({ path, method }) => {
        console.log(`${method} ${path}`)
      })
    }

    this.app.defineRoutes = function defineRoutes(routes, routeOptions) {
      app.register(function register(currentApp, opts, done) {
        const defaultRequestHooks = routeOptions?.onRequestHooks ?? [
          container.resolve<AccessTokenMiddleware>(AccessTokenMiddleware)
            .handle,
          container.resolve<TeamMiddleware>(TeamMiddleware).handle,
        ]

        defaultRequestHooks.forEach((onRequestHook) => {
          currentApp.addHook("onRequest", onRequestHook)
        })

        routes.forEach(([method, url, handler]) =>
          currentApp.route({ method, url, handler }),
        )

        done()
      }, routeOptions)
    }

    this.app.setErrorHandler(globalErrorHandler)

    return this
  }

  bootDatabaseConnector() {
    return this
  }

  async start() {
    await this.startDatabaseConnector()
    await this.startSinglePageApplication()

    await container.resolve(InstallationSettings).ensureInstallationSettings()

    await this.startHttpServer()
  }

  async startSinglePageApplication() {
    // no implementation in prod. Only in dev.
  }

  async startDatabaseConnector() {
    const connection = await createDatabaseClient(this.env.DATABASE_URL)

    this.database = createDrizzleDatabase(connection)

    container.registerInstance(ContainerKey.database, this.database)

    try {
      await runDatabaseMigrations(this.database)
    } catch (error) {
      d({ error })
      throw error
    }

    return this
  }

  async startHttpServer() {
    try {
      this.registerHttpControllers()

      if (this.env.isTest) {
        return this
      }

      await this.app.listen({
        port: this.env.PORT,
        host: this.env.HOST,
      })

      return this
    } catch (error) {
      this.app.log.error(error)

      process.exit(1)
    }
  }

  registerHttpControllers() {
    container.resolve(AudienceController)
    container.resolve(AuthController)
    container.resolve(UserController)
    container.resolve(ContactController)
    container.resolve(MailerController)
    container.resolve(TeamController)
    container.resolve(MailerWebhooksContorller)
    container.resolve(MailerIdentityController)
    container.resolve(RootController)
  }

  async shutdown() {
    await this.app.close()
  }
}
