import { Mailer, MailerIdentity, Prisma, PrismaClient } from "@prisma/client"
import { inject, injectable } from "tsyringe"

import { CreateMailerIdentityDto } from "@/domains/teams/dto/create_mailer_identity_dto"
import { ContainerKey } from "@/infrastructure/container"

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
}
