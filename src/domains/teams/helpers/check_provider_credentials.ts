import type { MailerConfiguration } from '@/domains/shared/types/mailer.js'
import type { MailerRepository } from '@/domains/teams/repositories/mailer_repository.js'
import type { Mailer } from '@/infrastructure/database/schema/types.js'
import { AwsSdk } from '@/providers/ses/sdk.js'

export class CheckProviderCredentials {
  constructor(
    private mailer: Mailer,
    private configuration: MailerConfiguration,
    private mailerRepository?: MailerRepository,
  ) {}

  async execute(updateMailerStatus?: boolean) {
    if (this.mailer.provider === 'AWS_SES') {
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
        await this.mailerRepository.setMailerStatus(
          this.mailer,
          'ACCESS_KEYS_LOST_PROVIDER_ACCESS',
        )
      }

      return credentialsAreValid
    }

    return false
  }
}
