import { MailerConfiguration } from "@/domains/shared/types/mailer.js"
import { CreateMailerIdentityDto } from "@/domains/teams/dto/create_mailer_identity_dto.js"
import { MailerIdentityRepository } from "@/domains/teams/repositories/mailer_identity_repository.js"
import { MailerRepository } from "@/domains/teams/repositories/mailer_repository.js"
import { E_VALIDATION_FAILED } from "@/http/responses/errors.js"
import { makeConfig } from "@/infrastructure/container.js"
import {
  Mailer,
  MailerIdentity,
  Team,
} from "@/infrastructure/database/schema/types.js"
import { AwsSdk } from "@/providers/ses/sdk.js"
import { container } from "@/utils/typi.js"

export class CreateMailerIdentityAction {
  constructor(
    private mailerIdentityRepository: MailerIdentityRepository = container.make(
      MailerIdentityRepository,
    ),
    private mailerRepository: MailerRepository = container.make(
      MailerRepository,
    ),
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

    if (
      !configuration.accessKey ||
      !configuration.accessSecret ||
      !configuration.region
    ) {
      throw E_VALIDATION_FAILED([
        {
          field: "mailer.configuration",
          message: "Mailer is not correctly configured.",
        },
      ])
    }

    const { id: identityId } = await this.mailerIdentityRepository.create(
      payload,
      mailer.id,
    )

    const configurationSetName = `${makeConfig().software.shortName}_${mailer.id}`

    if (mailer.provider === "AWS_SES") {
      try {
        const { privateKey, publicKey } = await this.createSesMailerIdentity(
          { ...payload, id: identityId },
          configurationSetName,
          configuration,
        )

        if (payload.type === "DOMAIN") {
          const encryptedKeyPair =
            await this.mailerIdentityRepository.encryptRsaPrivateKey(
              team.configurationKey,
              privateKey,
            )

          await this.mailerIdentityRepository.update(identityId, {
            configuration: {
              privateKey: encryptedKeyPair.privateKey.release(),
              publicKey: publicKey.release(),
            },
          })
        }
      } catch (error) {
        await this.mailerIdentityRepository.delete(identityId)

        throw error
      }
    }

    return { id: identityId }
  }

  async createSesMailerIdentity(
    identity: Pick<MailerIdentity, "id" | "value" | "type">,
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
        identity.type!,
        makeConfig().software.shortName,
      )
  }
}
