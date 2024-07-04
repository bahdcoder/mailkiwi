import { Mailer, Team } from "@prisma/client"
import { inject, injectable } from "tsyringe"

import { UpdateMailerDto } from "@/domains/teams/dto/mailers/update_mailer_dto"
import { MailerRepository } from "@/domains/teams/repositories/mailer_repository"
import { AwsSdk } from "@/providers/ses/sdk"

@injectable()
export class UpdateMailerAction {
  constructor(
    @inject(MailerRepository)
    private mailerRepository: MailerRepository,
  ) {}

  handle = async (mailer: Mailer, payload: UpdateMailerDto, team: Team) => {
    const configurationKeysAreValid =
      await this.authenticateProviderCredentials(mailer, payload)

    if (!configurationKeysAreValid) {
      return null
    }

    const updatedMailer = await this.mailerRepository.update(
      mailer,
      payload,
      team,
    )

    return updatedMailer
  }

  private async authenticateProviderCredentials(
    mailer: Mailer,
    payload: UpdateMailerDto,
  ) {
    const { configuration } = payload

    switch (mailer.provider) {
      case "AWS_SES":
        if (
          !configuration.accessKey ||
          !configuration.accessSecret ||
          !configuration.region
        ) {
          return false
        }
        return await new AwsSdk(
          configuration.accessKey,
          configuration.accessSecret,
          configuration.region,
        )
          .permissionsChecker()
          .checkAllAccess()
      default:
        return false
    }
  }
}
