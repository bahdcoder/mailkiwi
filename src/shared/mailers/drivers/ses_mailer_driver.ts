import type {
  MailObject,
  MailerDriver,
  MailerDriverError,
  MailerDriverResponse,
} from "@/shared/mailers/mailer_types.js";

export class AWSSESDriver implements MailerDriver {
  async send(
    mail: MailObject,
  ): Promise<[MailerDriverResponse, MailerDriverError]> {
    return [{ messageId: "true" }, null];
  }
}
