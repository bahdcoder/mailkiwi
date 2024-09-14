import "./globals"
import { RootController } from "@/views/controllers/root_controller.js"
import { MailerWebhooksContorller } from "@/webhooks/controllers/mailer_webhooks_controller.ts"
import type { Redis } from "ioredis"

import { BroadcastController } from "@/broadcasts/controllers/broadcast_controller.ts"

import { AudienceController } from "@/audiences/controllers/audience_controller.js"
import { ContactController } from "@/audiences/controllers/contact_controller.ts"
import { ContactExportController } from "@/audiences/controllers/contact_export_controller.ts"
import { ContactImportController } from "@/audiences/controllers/contact_import_controller.ts"
import { SegmentController } from "@/audiences/controllers/segment_controller.ts"
import { TagController } from "@/audiences/controllers/tag_controller.ts"

import { TeamController } from "@/teams/controllers/team_controller.ts"
import { TeamMembershipController } from "@/teams/controllers/team_membership_controller.ts"

import { AuthController } from "@/auth/controllers/auth_controller.ts"
import { UserController } from "@/auth/controllers/user_controller.js"

import { AutomationController } from "@/automations/controllers/automation_controller.js"

import { SendingDomainController } from "@/sending_domains/controllers/sending_domain_controller.ts"

import {
  type DrizzleClient,
  createDatabaseClient,
  createDrizzleDatabase,
} from "@/database/client.js"

import { Hono, type HonoInstance } from "@/server/hono.js"

import {
  ContainerKey,
  makeDatabaseConnection,
  makeRedis,
} from "@/shared/container/index.js"
import {
  type ConfigVariables,
  type EnvVariables,
  config,
  env,
} from "@/shared/env/index.js"
import { Mailer } from "@/shared/mailers/mailer.js"
import type { MailerDriver } from "@/shared/mailers/mailer_types.js"

import { createRedisDatabaseInstance } from "@/redis/redis_client.ts"

import { container } from "@/utils/typi.js"

export class Ignitor {
  protected env: EnvVariables
  protected config: ConfigVariables
  protected app: HonoInstance
  protected database: DrizzleClient
  protected redis: Redis

  boot() {
    this.env = env
    this.config = config

    this.bootHttpServer()

    container.register(ContainerKey.app, this.app)
    container.register(ContainerKey.env, this.env)
    container.register(ContainerKey.config, this.config)

    return this
  }

  bootHttpServer() {
    this.app = new Hono()

    return this
  }

  async start() {
    await this.startDatabaseConnector()
    this.startSinglePageApplication()

    this.registerHttpControllers()

    this.startHttpServer()

    return this
  }

  async startSinglePageApplication() {
    // no implementation in prod. Only in dev.
  }

  async startDatabaseConnector() {
    if (this.database) return this

    const connection = await createDatabaseClient(this.env.DATABASE_URL)
    const redisConnection = createRedisDatabaseInstance(this.env.REDIS_URL)

    this.database = createDrizzleDatabase(connection)

    this.redis = redisConnection

    container.registerInstance(ContainerKey.redis, this.redis)
    container.registerInstance(ContainerKey.database, this.database)
    container.registerInstance(ContainerKey.databaseConnection, connection)

    return this
  }

  startHttpServer() {}

  registerHttpControllers() {
    container.resolve(AudienceController)
    container.resolve(SegmentController)
    container.resolve(BroadcastController)
    container.resolve(TagController)
    container.resolve(AutomationController)
    container.resolve(AuthController)
    container.resolve(UserController)
    container.resolve(ContactController)
    container.resolve(TeamController)
    container.resolve(ContactExportController)
    container.resolve(ContactImportController)
    container.resolve(TeamMembershipController)
    container.resolve(MailerWebhooksContorller)
    container.resolve(SendingDomainController)
    container.resolve(RootController)
  }

  async shutdown() {
    const connection = makeDatabaseConnection()
    const redis = makeRedis()

    if (connection) {
      connection.destroy()
    }

    redis.disconnect()
  }
}
