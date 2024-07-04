import { Mailer, Team } from "@prisma/client"
import { inject, injectable } from "tsyringe"

import { MailerConfiguration } from "@/domains/shared/types/mailer"
import { CreateMailerIdentityDto } from "@/domains/teams/dto/create_mailer_identity_dto"
import { MailerIdentityRepository } from "@/domains/teams/repositories/mailer_identity_repository"
import { makeConfig } from "@/infrastructure/container"
import { AwsSdk } from "@/providers/ses/sdk"

import { MailerRepository } from "../repositories/mailer_repository"

@injectable()
export class CreateMailerIdentityAction {
  constructor(
    @inject(MailerIdentityRepository)
    private mailerIdentityRepository: MailerIdentityRepository,
    @inject(MailerRepository)
    private mailerRepository: MailerRepository,
  ) {}

  handle = async (
    payload: CreateMailerIdentityDto,
    mailer: Mailer,
    team: Team,
  ) => {
    const configuration = this.mailerRepository.getDecryptedConfiguration(
      mailer.configuration,
      team.configurationKey,
    ) as MailerConfiguration

    const identity = await this.mailerIdentityRepository.create(payload, mailer)

    const configurationSetName = `${makeConfig().software.shortName}_${mailer.id}`

    switch (mailer.provider) {
      case "AWS_SES":
        try {
          await this.createSesMailerIdentity(
            identity.value,
            configurationSetName,
            configuration,
          )
        } catch (error) {
          await this.mailerIdentityRepository.delete(identity)

          throw error
        }
        break

      default:
        break
    }

    return identity
  }

  async createSesMailerIdentity(
    identity: string,
    configurationSetName: string,
    configuration: MailerConfiguration,
  ) {
    await new AwsSdk(
      configuration.accessKey,
      configuration.accessSecret,
      configuration.region,
    )
      .sesService()
      .createIdentity(configurationSetName, identity)
  }
}
