import type { MailerConfiguration } from '@/domains/shared/types/mailer.js'
import { MailerRepository } from '@/domains/teams/repositories/mailer_repository.js'
import type { Mailer } from '@/infrastructure/database/schema/types.js'
import { AwsSdk } from '@/providers/ses/sdk.js'
import { container } from '@/utils/typi.ts'

export class CheckProviderCredentials {
  private checkProviderSendingEnabled = false

  constructor(
    private configuration: MailerConfiguration,
    private mailer?: Mailer,
    private mailerRepository: MailerRepository = container.make(
      MailerRepository,
    ),
  ) {}

  checkSendingEnabled() {
    this.checkProviderSendingEnabled = true

    return this
  }

  async execute(updateMailerStatus?: boolean) {
    if (
      !this.configuration.accessKey ||
      !this.configuration.accessSecret ||
      !this.configuration.region
    ) {
      return false
    }

    const sdk = new AwsSdk(
      this.configuration.accessKey,
      this.configuration.accessSecret,
      this.configuration.region,
    )

    const credentialsAreValid = await sdk.permissionsChecker().checkAllAccess()

    let enabled: boolean | undefined = undefined

    if (credentialsAreValid && this.checkProviderSendingEnabled) {
      const { Enabled } = await sdk.sesService().getAccountSendingEnabled()

      enabled = Enabled

      if (this.mailer && !Enabled) {
        await this.mailerRepository.setMailerStatus(
          this.mailer,
          'ACCOUNT_SENDING_NOT_ENABLED',
        )

        return enabled
      }
    }

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
