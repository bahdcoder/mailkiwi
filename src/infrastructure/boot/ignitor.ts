import { container } from "tsyringe"
import { PrismaClient } from "@prisma/client"
import Fastify, { FastifyInstance } from "fastify"
import { env, EnvVariables } from "@/infrastructure/env"
import { ContainerKey } from "@/infrastructure/container"

import { AudienceController } from "@/http/api/controllers/audiences/audience_controller"
import { AuthController } from "@/http/api/controllers/auth/auth_controller"
import { UserController } from "@/http/api/controllers/auth/user_controller"
import { AccessTokenMiddleware } from "@/http/api/middleware/auth/access_token_middleware"
import { TeamMiddleware } from "@/http/api/middleware/audiences/team_middleware"
import { ContactController } from "@/http/api/controllers/audiences/contact_controller"
import { globalErrorHandler } from "@/http/responses/error_handler"
import { MailerController } from "@/http/api/controllers/teams/mailer_controller"
import { TeamController } from "@/http/api/controllers/teams/team_controller"

export class Ignitor {
  protected env: EnvVariables
  protected app: FastifyInstance
  protected database: PrismaClient

  boot() {
    this.env = env

    this.bootHttpServer()
    this.bootDatabaseConnector()

    container.registerInstance(ContainerKey.app, this.app)
    container.registerInstance(ContainerKey.env, this.env)
    container.registerInstance(ContainerKey.database, this.database)

    return this
  }

  register() {
    this.registerHttpControllers()

    return this
  }

  bootHttpServer() {
    this.app = Fastify({ logger: !this.env.isTest })

    const app = this.app

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
    this.database = new PrismaClient()

    return this
  }

  async startHttpServer() {
    try {
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
  }

  async shutdown() {
    await this.app.close()
  }
}
