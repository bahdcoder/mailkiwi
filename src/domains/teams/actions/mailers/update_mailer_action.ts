import { Mailer, Team } from "@prisma/client"
import { container, inject, injectable } from "tsyringe"

import { UpdateMailerDto } from "@/domains/teams/dto/mailers/update_mailer_dto"
import { MailerRepository } from "@/domains/teams/repositories/mailer_repository"
import { AwsSdk } from "@/providers/ses/sdk"

import { CreateMailerIdentityDto } from "../../dto/create_mailer_identity_dto"
import { CreateMailerIdentityAction } from "../create_mailer_identity_action"

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

    if (payload.configuration.domain || payload.configuration.domain) {
      const mailerIdentityAction = container.resolve(CreateMailerIdentityAction)

      const mailerIdentityPayload: CreateMailerIdentityDto = {
        value: payload.configuration.domain ?? payload.configuration.email,
        type: payload.configuration.domain ? "DOMAIN" : "EMAIL",
      }

      try {
        await mailerIdentityAction.handle(
          mailerIdentityPayload,
          updatedMailer,
          team,
        )
      } catch (error) {
        await this.mailerRepository.delete(updatedMailer)

        throw error
      }
    }

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
