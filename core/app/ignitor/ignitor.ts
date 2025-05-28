import { appEnv } from "#root/core/app/env/app_env.js";
import { ChannelController } from "#root/core/chat/controllers/channel_controller.js";
import { ChatController } from "#root/core/chat/controllers/chat_controller.js";
import { CommerceProviderController } from "#root/core/commerce/controllers/commerce_provider_controller.js";
import { ProductController } from "#root/core/commerce/controllers/product_controller.js";
import { FormController } from "#root/core/forms/controllers/form_controller.js";
import { FormResponsesController } from "#root/core/forms/controllers/form_responses_controller.js";
import { InjectEmailController } from "#root/core/injector/controllers/inject_email_controller.js";
import { MtaLogsController } from "#root/core/kumologs/controllers/mta_logs_controller.js";
import { DkimController } from "#root/core/kumomta/controllers/dkim_controller.js";
import { SmtpAuthController } from "#root/core/kumomta/controllers/smtp_auth_controller.js";
import { TrackingController } from "#root/core/kumomta/controllers/tracking_controller.js";
import { MediaDocumentController } from "#root/core/media-library/controllers/media_library_controller.js";
import { ClickTrackingController } from "#root/core/tracking/controllers/click_tracking_controller.js";
import { OpenTrackingController } from "#root/core/tracking/controllers/open_tracking_controller.js";
import { MailerWebhooksController } from "#root/core/webhooks/controllers/mailer_webhooks_controller.js";
import { WebsiteController } from "#root/core/websites/controllers/website_controller.js";

import { BroadcastController } from "#root/core/broadcasts/controllers/broadcast_controller.js";
import { BroadcastGroupController } from "#root/core/broadcasts/controllers/broadcast_group_controller.js";

import { AudienceController } from "#root/core/audiences/controllers/audience_controller.js";
import { ContactController } from "#root/core/audiences/controllers/contact_controller.js";
import { ContactExportController } from "#root/core/audiences/controllers/contact_export_controller.js";
import { ContactImportController } from "#root/core/audiences/controllers/contact_import_controller.js";
import { SegmentController } from "#root/core/audiences/controllers/segment_controller.js";
import { TagController } from "#root/core/audiences/controllers/tag_controller.js";

import { TeamController } from "#root/core/teams/controllers/team_controller.js";
import { TeamMembershipController } from "#root/core/teams/controllers/team_membership_controller.js";

import { AuthController } from "#root/core/auth/controllers/auth_controller.js";
import { Oauth2Controller } from "#root/core/auth/controllers/oauth2_controller.js";
import { RegisterController } from "#root/core/auth/controllers/register_controller.js";
import { UserController } from "#root/core/auth/controllers/user_controller.js";
import { PasswordResetsController } from "#root/core/auth/password_resets/controllers/password_resets_controller.js";

import { AutomationController } from "#root/core/automations/controllers/automation_controller.js";

import { SendingDomainController } from "#root/core/sending_domains/controllers/sending_domain_controller.js";
import { SenderIdentityController } from "#root/core/sending_domains/controllers/sender_identity_controller.js";

import { type DrizzleClient, schema } from "#root/database/client.js";
import {
  makeDatabaseConnection,
  makeRedis,
} from "#root/core/shared/container/index.js";
import { Hono } from "#root/core/shared/server/hono.js";
import { Ignitor as FrameworkIgnitor } from "@kibamail/framework";
import "#root/core/shared/utils/log/dump.js";

import { container } from "@kibamail/framework";

export class Ignitor extends FrameworkIgnitor<typeof appEnv, DrizzleClient> {
  constructor() {
    super(appEnv, schema);
  }

  boot() {
    super.boot(Hono)

    return this
  }

  registerHttpControllers() {
    container.resolve(AudienceController);
    container.resolve(SegmentController);
    container.resolve(BroadcastController);
    container.resolve(TagController);
    container.resolve(AutomationController);
    container.resolve(AuthController);
    container.resolve(Oauth2Controller);
    container.resolve(RegisterController);
    container.resolve(PasswordResetsController);
    container.resolve(UserController);
    container.resolve(ContactController);
    container.resolve(TeamController);
    container.resolve(ContactExportController);
    container.resolve(ContactImportController);
    container.resolve(TeamMembershipController);
    container.resolve(MailerWebhooksController);
    container.resolve(SendingDomainController);
    container.resolve(SenderIdentityController);
    container.resolve(MtaLogsController);
    container.resolve(DkimController);
    container.resolve(SmtpAuthController);
    container.resolve(InjectEmailController);
    container.resolve(TrackingController);
    container.resolve(ClickTrackingController);
    container.resolve(OpenTrackingController);
    container.resolve(WebsiteController);

    container.resolve(ProductController);
    container.resolve(CommerceProviderController);

    container.resolve(FormController);
    container.resolve(FormResponsesController);

    container.resolve(ChatController);
    container.resolve(ChannelController);
    container.resolve(BroadcastGroupController);

    container.resolve(MediaDocumentController);
  }

  async shutdown() {
    const connection = makeDatabaseConnection();
    const redis = makeRedis();

    if (connection) {
      connection.destroy();
    }

    redis.disconnect();
  }
}
