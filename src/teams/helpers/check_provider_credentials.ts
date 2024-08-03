import type { MailerConfiguration } from "@/shared/types/mailer.js";
import { MailerRepository } from "@/teams/repositories/mailer_repository.js";
import type { Mailer } from "@/database/schema/types.js";
import { AwsSdk } from "@/ses/sdk.js";
import { container } from "@/utils/typi.js";

export class CheckProviderCredentials {
  private checkProviderSendingEnabled = false;

  constructor(
    private configuration: MailerConfiguration,
    private mailer?: Mailer,
    private mailerRepository: MailerRepository = container.make(
      MailerRepository,
    ),
  ) {}

  checkSendingEnabled() {
    this.checkProviderSendingEnabled = true;

    return this;
  }

  credentialsExist() {
    return (
      this.configuration.accessKey &&
      this.configuration.accessSecret &&
      this.configuration.region
    );
  }

  async execute(updateMailerStatus?: boolean) {
    if (!this.credentialsExist()) return false;

    const sdk = new AwsSdk(
      this.configuration.accessKey,
      this.configuration.accessSecret,
      this.configuration.region,
    );

    const credentialsAreValid = await sdk.permissionsChecker().checkAllAccess();

    let enabled: boolean | undefined = undefined;

    if (credentialsAreValid && this.checkProviderSendingEnabled) {
      const { Enabled } = await sdk.sesService().getAccountSendingEnabled();

      enabled = Enabled;

      if (this.mailer && !Enabled) {
        await this.mailerRepository.setMailerStatus(
          this.mailer,
          "ACCOUNT_SENDING_NOT_ENABLED",
        );

        return enabled;
      }
    }

    if (!credentialsAreValid && updateMailerStatus && this.mailerRepository) {
      if (this.mailer) {
        await this.mailerRepository.setMailerStatus(
          this.mailer,
          "ACCESS_KEYS_LOST_PROVIDER_ACCESS",
        );
      }
    }

    return credentialsAreValid;
  }
}
