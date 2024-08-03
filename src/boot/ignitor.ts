import type { MailerDriver } from "@/shared/mailers/mailer_types.js";
import "./globals";

import { Mailer } from "@/shared/mailers/mailer.js";
import { AudienceController } from "@/http/api/controllers/audiences/audience_controller.js";
import { ContactController } from "@/http/api/controllers/audiences/contact_controller.js";
import { TagController } from "@/http/api/controllers/audiences/tag_controller.js";
import { AuthController } from "@/http/api/controllers/auth/auth_controller.js";
import { UserController } from "@/http/api/controllers/auth/user_controller.js";
import { AutomationController } from "@/http/api/controllers/automations/automation_controller.js";
import { BroadcastController } from "@/http/api/controllers/broadcasts/broadcast_controller.js";
import { MailerController } from "@/http/api/controllers/teams/mailer_controller.js";
import { MailerIdentityController } from "@/http/api/controllers/teams/mailer_identity_controller.js";
import { TeamController } from "@/http/api/controllers/teams/team_controller.js";
import { MailerWebhooksContorller } from "@/http/api/controllers/webhooks/mailer_webhooks_controller.js";
import { RootController } from "@/http/views/controllers/root_controller.js";
import {
  ContainerKey,
  makeDatabaseConnection,
} from "@/shared/container/index.js";
import {
  type DrizzleClient,
  createDatabaseClient,
  createDrizzleDatabase,
} from "@/database/client.js";
import {
  type ConfigVariables,
  type EnvVariables,
  config,
  env,
} from "@/shared/env/index.js";
import { Hono, type HonoInstance } from "@/server/hono.js";
import { container } from "@/utils/typi.js";
import { SegmentController } from "@/http/api/controllers/audiences/segment_controller.ts";

export class Ignitor {
  protected env: EnvVariables;
  protected config: ConfigVariables;
  protected app: HonoInstance;
  protected database: DrizzleClient;
  protected mailer: MailerDriver;

  boot() {
    this.env = env;
    this.config = config;

    this.bootHttpServer();

    container.register(ContainerKey.app, this.app);
    container.register(ContainerKey.env, this.env);
    container.register(ContainerKey.config, this.config);

    return this;
  }

  bootHttpServer() {
    this.app = new Hono();

    return this;
  }

  mailerDriver(makeDriver: (env: EnvVariables) => MailerDriver) {
    Mailer.setDriver(makeDriver(this.env));

    return this;
  }

  async start() {
    await this.startDatabaseConnector();
    this.startSinglePageApplication();

    this.registerHttpControllers();

    this.startHttpServer();

    return this;
  }

  async startSinglePageApplication() {
    // no implementation in prod. Only in dev.
  }

  async startDatabaseConnector() {
    if (this.database) return this;

    const connection = await createDatabaseClient(this.env.DATABASE_URL);

    this.database = createDrizzleDatabase(connection);

    container.registerInstance(ContainerKey.database, this.database);
    container.registerInstance(ContainerKey.databaseConnection, connection);

    return this;
  }

  startHttpServer() {}

  registerHttpControllers() {
    container.resolve(AudienceController);
    container.resolve(SegmentController);
    container.resolve(BroadcastController);
    container.resolve(TagController);
    container.resolve(AutomationController);
    container.resolve(AuthController);
    container.resolve(UserController);
    container.resolve(ContactController);
    container.resolve(MailerController);
    container.resolve(TeamController);
    container.resolve(MailerWebhooksContorller);
    container.resolve(MailerIdentityController);
    container.resolve(RootController);
  }

  async shutdown() {
    const connection = makeDatabaseConnection();

    if (connection) {
      connection.destroy();
    }
  }
}
