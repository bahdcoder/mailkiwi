import { Secret } from "@poppinss/utils"
import { Mailer, MailerIdentity, Prisma, PrismaClient } from "@prisma/client"
import { inject, injectable } from "tsyringe"

import { Encryption } from "@/domains/shared/utils/encryption/encryption"
import { CreateMailerIdentityDto } from "@/domains/teams/dto/create_mailer_identity_dto"
import { ContainerKey, makeEnv } from "@/infrastructure/container"

@injectable()
export class MailerIdentityRepository {
  constructor(@inject(ContainerKey.database) private database: PrismaClient) {}

  async findMany(args?: Partial<Prisma.MailerIdentityFindManyArgs>) {
    return this.database.mailerIdentity.findMany(args)
  }

  async create(payload: CreateMailerIdentityDto, mailer: Mailer) {
    return this.database.mailerIdentity.create({
      data: {
        ...payload,
        mailerId: mailer.id,
      },
    })
  }

  async update(
    identity: MailerIdentity,
    payload: Prisma.MailerIdentityUpdateInput,
  ) {
    return this.database.mailerIdentity.update({
      where: {
        id: identity.id,
      },
      data: payload,
    })
  }

  async delete(identity: MailerIdentity) {
    await this.database.mailerIdentity.delete({
      where: {
        id: identity.id,
      },
    })
  }

  async encryptRsaPrivateKey(
    teamConfigurationKey: string,
    privateKey: Secret<string>,
  ) {
    const decryptedConfigurationKey = new Secret(
      new Encryption({
        secret: makeEnv().APP_KEY,
      }).decrypt<string>(teamConfigurationKey)!,
    )

    const encryption = new Encryption({ secret: decryptedConfigurationKey })

    return {
      privateKey: new Secret(encryption.encrypt(privateKey.release())),
    }
  }
}
