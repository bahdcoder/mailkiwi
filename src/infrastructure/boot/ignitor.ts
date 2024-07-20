import "./globals"

import { AudienceController } from "@/http/api/controllers/audiences/audience_controller.js"
import { ContactController } from "@/http/api/controllers/audiences/contact_controller.js"
import { AuthController } from "@/http/api/controllers/auth/auth_controller.js"
import { UserController } from "@/http/api/controllers/auth/user_controller.js"
import { AutomationController } from "@/http/api/controllers/automations/automation_controller.js"
import { MailerController } from "@/http/api/controllers/teams/mailer_controller.js"
import { MailerIdentityController } from "@/http/api/controllers/teams/mailer_identity_controller.js"
import { TeamController } from "@/http/api/controllers/teams/team_controller.js"
import { MailerWebhooksContorller } from "@/http/api/controllers/webhooks/mailer_webhooks_controller.js"
import { RootController } from "@/http/views/controllers/root_controller.js"
import { InstallationSettings } from "@/infrastructure/boot/installation_settings.js"
import { ContainerKey } from "@/infrastructure/container.js"
import {
  createDatabaseClient,
  createDrizzleDatabase,
  DrizzleClient,
} from "@/infrastructure/database/client.js"
import {
  config,
  ConfigVariables,
  env,
  EnvVariables,
} from "@/infrastructure/env.js"
import { ExtendedHono } from "@/infrastructure/server/hono.js"
import { container } from "@/utils/typi.js"

export class Ignitor {
  protected env: EnvVariables
  protected config: ConfigVariables
  protected app: ExtendedHono<{ Bindings: { _: boolean } }>
  protected database: DrizzleClient

  boot() {
    this.env = env
    this.config = config

    this.bootHttpServer()
    this.bootDatabaseConnector()

    container.register(ContainerKey.app, this.app)
    container.register(ContainerKey.env, this.env)
    container.register(ContainerKey.config, this.config)

    return this
  }

  bootHttpServer() {
    this.app = new ExtendedHono()

    this.app.defineErrorHandler()

    return this
  }

  bootDatabaseConnector() {
    return this
  }

  async start() {
    await this.startDatabaseConnector()
    await this.startSinglePageApplication()

    this.registerHttpControllers()

    await container.resolve(InstallationSettings).ensureInstallationSettings()

    await this.startHttpServer()
  }

  async startSinglePageApplication() {
    // no implementation in prod. Only in dev.
  }

  async startDatabaseConnector() {
    if (this.database) return this

    const connection = await createDatabaseClient(this.env.DATABASE_URL)

    this.database = createDrizzleDatabase(connection)

    container.registerInstance(ContainerKey.database, this.database)

    try {
      // await runDatabaseMigrations(this.database)
    } catch (error) {
      d({ error })
      throw error
    }

    return this
  }

  async startHttpServer() {}

  registerHttpControllers() {
    container.resolve(AudienceController)
    container.resolve(AutomationController)
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
    // await this.app.close()
  }
}
