import { Mailer, MailerIdentity, Prisma, Team } from "@prisma/client"
import { inject, injectable } from "tsyringe"

import { MailerConfiguration } from "@/domains/shared/types/mailer"
import { CreateMailerIdentityDto } from "@/domains/teams/dto/create_mailer_identity_dto"
import { MailerIdentityRepository } from "@/domains/teams/repositories/mailer_identity_repository"
import { MailerRepository } from "@/domains/teams/repositories/mailer_repository"
import { makeConfig } from "@/infrastructure/container"
import { AwsSdk } from "@/providers/ses/sdk"

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

    let identity = await this.mailerIdentityRepository.create(payload, mailer)

    const configurationSetName = `${makeConfig().software.shortName}_${mailer.id}`

    if (mailer.provider === "AWS_SES") {
      try {
        if (identity.type === "DOMAIN") {
          const { privateKey, publicKey } = await this.createSesMailerIdentity(
            identity,
            configurationSetName,
            configuration,
          )

          const encryptedKeyPair =
            await this.mailerIdentityRepository.encryptRsaPrivateKey(
              team.configurationKey,
              privateKey,
            )

          identity = await this.mailerIdentityRepository.update(identity, {
            configuration: {
              ...(identity.configuration as Prisma.JsonObject),
              privateKey: encryptedKeyPair.privateKey.release(),
              publicKey: publicKey.release(),
            },
          })
        }
      } catch (error) {
        await this.mailerIdentityRepository.delete(identity)

        throw error
      }
    }

    return identity
  }

  async createSesMailerIdentity(
    identity: MailerIdentity,
    configurationSetName: string,
    configuration: MailerConfiguration,
  ) {
    return new AwsSdk(
      configuration.accessKey,
      configuration.accessSecret,
      configuration.region,
    )
      .sesService()
      .createIdentity(
        configurationSetName,
        identity.value,
        identity.type,
        makeConfig().software.shortName,
      )
  }
}
