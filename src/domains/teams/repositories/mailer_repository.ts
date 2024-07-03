import { inject, injectable } from "tsyringe"
import { Encryption } from "@/domains/shared/utils/encryption/encryption"
import { Mailer, MailerProvider, PrismaClient, Team } from "@prisma/client"

import { ContainerKey, makeEnv } from "@/infrastructure/container"
import { CreateMailerDto } from "@/domains/teams/dto/mailers/create_mailer_dto"
import { Secret } from "@poppinss/utils"
import { UpdateMailerDto } from "../dto/mailers/update_mailer_dto"

@injectable()
export class MailerRepository {
  defaultConfigurationPayload: UpdateMailerDto["configuration"] = {
    accessKey: "",
    accessSecret: "",
    region: "",
    domain: "",
    maximumMailsPerSecond: 1,
  }

  constructor(@inject(ContainerKey.database) private database: PrismaClient) {}

  async create(payload: CreateMailerDto, team: Team) {
    return this.database.mailer.create({
      data: {
        ...payload,
        configuration: this.getEncryptedConfigurationPayload(
          this.defaultConfigurationPayload,
          team.configurationKey,
        ),
        teamId: team.id,
      },
    })
  }

  async findById(mailerId: string) {
    return this.database.mailer.findFirst({
      where: {
        id: mailerId,
      },
    })
  }

  async update(mailer: Mailer, payload: UpdateMailerDto, team: Team) {
    const configuration = {
      ...this.getDecryptedConfiguration(
        mailer.configuration,
        team.configurationKey,
      ),
      ...payload.configuration,
    }

    const encryptedConfiguration = this.getEncryptedConfigurationPayload(
      configuration,
      team.configurationKey,
    )

    const updatedMailer = await this.database.mailer.update({
      where: {
        id: mailer.id,
      },
      data: {
        configuration: encryptedConfiguration,
      },
    })

    return updatedMailer
  }

  getDecryptedConfiguration(
    configuration: string,
    encryptedConfigurationKey: string,
  ) {
    const configurationKey = new Secret(
      new Encryption({
        secret: makeEnv().APP_KEY,
      }).decrypt<string>(encryptedConfigurationKey)!,
    )

    const decrypted = new Encryption({
      secret: configurationKey,
    }).decrypt<string>(configuration)

    let decryptedConfiguration = this.defaultConfigurationPayload

    if (decrypted) {
      decryptedConfiguration = JSON.parse(
        decrypted,
      ) as UpdateMailerDto["configuration"]
    }

    return decryptedConfiguration
  }

  getEncryptedConfigurationPayload(
    configurationPayload: UpdateMailerDto["configuration"],
    encryptedConfigurationKey: string,
  ) {
    const configurationKey = new Secret(
      new Encryption({
        secret: makeEnv().APP_KEY,
      }).decrypt<string>(encryptedConfigurationKey)!,
    )

    const configuration = new Encryption({
      secret: configurationKey,
    }).encrypt(JSON.stringify(configurationPayload))

    return configuration
  }
}
