import { Exception } from "@poppinss/utils"
import { Mailer, MailerIdentity, Team } from "@prisma/client"
import { inject, injectable } from "tsyringe"

import { MailerConfiguration } from "@/domains/shared/types/mailer.js"
import { DeleteMailerIdentityDto } from "@/domains/teams/dto/delete_mailer_identity_dto.js"
import { CheckProviderCredentials } from "@/domains/teams/helpers/check_provider_credentials.js"
import { MailerIdentityRepository } from "@/domains/teams/repositories/mailer_identity_repository.js"
import { MailerRepository } from "@/domains/teams/repositories/mailer_repository.js"
import { E_OPERATION_FAILED } from "@/http/responses/errors.js"
import { AwsSdk } from "@/providers/ses/sdk.js"

@injectable()
export class DeleteMailerIdentityAction {
  constructor(
    @inject(MailerIdentityRepository)
    private mailerIdentityRepository: MailerIdentityRepository,
    @inject(MailerRepository)
    private mailerRepository: MailerRepository,
  ) {}

  handle = async (
    mailer: Mailer,
    mailerIdentity: MailerIdentity,
    payload: DeleteMailerIdentityDto,
    team: Team,
  ) => {
    const configuration = this.mailerRepository.getDecryptedConfiguration(
      mailer.configuration,
      team.configurationKey,
    ) as MailerConfiguration

    if (payload.deleteOnProvider) {
      // Implement provider-specific deletion logic here
      const credentialsAreValid = await new CheckProviderCredentials(
        mailer,
        configuration,
      ).execute(true)

      if (mailer.provider === "AWS_SES" && credentialsAreValid) {
        try {
          await new AwsSdk(
            configuration.accessKey,
            configuration.accessSecret,
            configuration.region,
          )
            .sesService()
            .deleteIdentity(mailerIdentity.value)
        } catch (error) {
          throw E_OPERATION_FAILED(
            "Could not delete identity on provider. Reason from provider: " +
              (error as Exception)?.message,
          )
        }
      }
    }

    await this.mailerIdentityRepository.delete(mailerIdentity)
  }
}
