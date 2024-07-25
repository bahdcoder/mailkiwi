import { MailerDriver } from '@/domains/shared/mailers/mailer_types.ts'
import './globals'

import { Queue } from '@/domains/shared/queue/queue.js'
import type { QueueDriver } from '@/domains/shared/queue/queue_driver_contact.js'
import { AudienceController } from '@/http/api/controllers/audiences/audience_controller.js'
import { ContactController } from '@/http/api/controllers/audiences/contact_controller.js'
import { TagController } from '@/http/api/controllers/audiences/tag_controller.ts'
import { AuthController } from '@/http/api/controllers/auth/auth_controller.js'
import { UserController } from '@/http/api/controllers/auth/user_controller.js'
import { AutomationController } from '@/http/api/controllers/automations/automation_controller.js'
import { BroadcastController } from '@/http/api/controllers/broadcasts/broadcast_controller.ts'
import { MailerController } from '@/http/api/controllers/teams/mailer_controller.js'
import { MailerIdentityController } from '@/http/api/controllers/teams/mailer_identity_controller.js'
import { TeamController } from '@/http/api/controllers/teams/team_controller.js'
import { MailerWebhooksContorller } from '@/http/api/controllers/webhooks/mailer_webhooks_controller.js'
import { RootController } from '@/http/views/controllers/root_controller.js'
import { InstallationSettings } from '@/infrastructure/boot/installation_settings.js'
import { ContainerKey } from '@/infrastructure/container.js'
import {
  type DrizzleClient,
  createDatabaseClient,
  createDrizzleDatabase,
} from '@/infrastructure/database/client.js'
import {
  type ConfigVariables,
  type EnvVariables,
  config,
  env,
} from '@/infrastructure/env.js'
import { Hono, type HonoInstance } from '@/infrastructure/server/hono.js'
import { container } from '@/utils/typi.js'
import { Mailer } from '@/domains/shared/mailers/mailer.ts'

export class Ignitor {
  protected env: EnvVariables
  protected config: ConfigVariables
  protected app: HonoInstance
  protected database: DrizzleClient
  protected queue: QueueDriver
  protected mailer: MailerDriver

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
    this.app = new Hono()

    return this
  }

  queueDriver(driver: QueueDriver) {
    Queue.setDriver(driver)

    return this
  }

  mailerDriver(makeDriver: (env: EnvVariables) => MailerDriver) {
    Mailer.setDriver(makeDriver(this.env))

    return this
  }

  bootDatabaseConnector() {
    return this
  }

  start() {
    this.startDatabaseConnector()
    this.startSinglePageApplication()

    this.registerHttpControllers()

    this.startHttpServer()

    return this
  }

  async startSinglePageApplication() {
    // no implementation in prod. Only in dev.
  }

  startDatabaseConnector() {
    if (this.database) return this

    const connection = createDatabaseClient(this.env.DATABASE_URL)

    this.database = createDrizzleDatabase(connection)

    connection.pragma('journal_mode = WAL')

    container.registerInstance(ContainerKey.database, this.database)
    container.registerInstance(ContainerKey.databaseConnection, connection)

    return this
  }

  startHttpServer() {}

  registerHttpControllers() {
    container.resolve(AudienceController)
    container.resolve(BroadcastController)
    container.resolve(TagController)
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
