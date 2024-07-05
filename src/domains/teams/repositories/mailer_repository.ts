import { Secret } from "@poppinss/utils"
import { Mailer, Prisma, PrismaClient, Team } from "@prisma/client"
import { inject, injectable } from "tsyringe"

import { MailerConfiguration } from "@/domains/shared/types/mailer"
import { Encryption } from "@/domains/shared/utils/encryption/encryption"
import { CreateMailerDto } from "@/domains/teams/dto/mailers/create_mailer_dto"
import { UpdateMailerDto } from "@/domains/teams/dto/mailers/update_mailer_dto"
import { ContainerKey, makeEnv } from "@/infrastructure/container"

@injectable()
export class MailerRepository {
  defaultConfigurationPayload: MailerConfiguration = {
    accessKey: new Secret(""),
    accessSecret: new Secret(""),
    region: "" as MailerConfiguration["region"],
    domain: "",
    email: "",
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

  async findById(
    mailerId: string,
    args?: Partial<Prisma.MailerFindUniqueArgs>,
  ) {
    return this.database.mailer.findFirst({
      where: {
        id: mailerId,
      },
      ...args,
    })
  }

  async delete(mailer: Mailer) {
    return this.database.mailer.delete({
      where: { id: mailer.id },
    })
  }

  async findMany(args?: Prisma.MailerFindManyArgs) {
    return this.database.mailer.findMany(args)
  }

  async setMailerStatus(mailer: Mailer, status: Mailer["status"]) {
    return this.database.mailer.update({
      where: {
        id: mailer.id,
      },
      data: {
        status,
      },
    })
  }

  async update(
    mailer: Mailer,
    updatePayload: Partial<UpdateMailerDto> &
      Omit<Prisma.MailerUpdateInput, "configuration">,
    team: Team,
  ) {
    const { configuration: payloadConfiguration, ...payload } = updatePayload
    const decryptedConfiguration = this.getDecryptedConfiguration(
      mailer.configuration,
      team.configurationKey,
    )

    const configuration = {
      ...decryptedConfiguration,
      ...(payloadConfiguration ?? {}),
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
        ...payload,
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
      const parsed = JSON.parse(decrypted)

      parsed.accessKey = new Secret(parsed.accessKey)
      parsed.accessSecret = new Secret(parsed.accessSecret)

      decryptedConfiguration = { ...parsed }
    }

    return decryptedConfiguration
  }

  getEncryptedConfigurationPayload(
    configurationPayload: MailerConfiguration,
    encryptedConfigurationKey: string,
  ) {
    const configurationKey = new Secret(
      new Encryption({
        secret: makeEnv().APP_KEY,
      }).decrypt<string>(encryptedConfigurationKey)!,
    )

    const configuration = new Encryption({
      secret: configurationKey,
    }).encrypt(
      JSON.stringify({
        ...configurationPayload,
        accessKey: configurationPayload.accessKey.release(),
        accessSecret: configurationPayload.accessSecret.release(),
      }),
    )

    return configuration
  }
}
