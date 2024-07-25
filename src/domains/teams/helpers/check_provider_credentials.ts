import type { MailerConfiguration } from '@/domains/shared/types/mailer.js'
import type { MailerRepository } from '@/domains/teams/repositories/mailer_repository.js'
import type { Mailer } from '@/infrastructure/database/schema/types.js'
import { AwsSdk } from '@/providers/ses/sdk.js'

export class CheckProviderCredentials {
  constructor(
    private configuration: MailerConfiguration,
    private mailerRepository?: MailerRepository,
    private mailer?: Mailer,
  ) {}

  async execute(updateMailerStatus?: boolean) {
    if (
      !this.configuration.accessKey ||
      !this.configuration.accessSecret ||
      !this.configuration.region
    ) {
      return false
    }

    const credentialsAreValid = await new AwsSdk(
      this.configuration.accessKey,
      this.configuration.accessSecret,
      this.configuration.region,
    )
      .permissionsChecker()
      .checkAllAccess()

    if (!credentialsAreValid && updateMailerStatus && this.mailerRepository) {
      if (this.mailer) {
        await this.mailerRepository.setMailerStatus(
          this.mailer,
          'ACCESS_KEYS_LOST_PROVIDER_ACCESS',
        )
      }
    }

    return credentialsAreValid
  }
}
