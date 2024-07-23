import { Secret } from '@poppinss/utils'
import { type SQLWrapper, and, eq } from 'drizzle-orm'

import { BaseRepository } from '@/domains/shared/repositories/base_repository.js'
import { Encryption } from '@/domains/shared/utils/encryption/encryption.js'
import type { CreateMailerIdentityDto } from '@/domains/teams/dto/create_mailer_identity_dto.js'
import { makeDatabase, makeEnv } from '@/infrastructure/container.js'
import type { DrizzleClient } from '@/infrastructure/database/client.js'
import { mailerIdentities } from '@/infrastructure/database/schema/schema.js'
import type {
  FindManyMailerIdentityArgs,
  UpdateSetMailerIdentityInput,
} from '@/infrastructure/database/schema/types.js'

export class MailerIdentityRepository extends BaseRepository {
  constructor(protected database: DrizzleClient = makeDatabase()) {
    super()
  }

  async findMany(args: FindManyMailerIdentityArgs) {
    return this.database.query.mailerIdentities.findMany(args)
  }

  async findById(mailerIdentityId: string, args?: SQLWrapper[]) {
    return this.database.query.mailerIdentities.findFirst({
      where: and(eq(mailerIdentities.id, mailerIdentityId), ...(args ?? [])),
    })
  }

  async create(payload: CreateMailerIdentityDto, mailerId: string) {
    const id = this.cuid()

    await this.database.insert(mailerIdentities).values({
      id,
      ...payload,
      mailerId,
    })

    return { id }
  }

  async update(identityId: string, payload: UpdateSetMailerIdentityInput) {
    await this.database
      .update(mailerIdentities)
      .set({
        ...payload,
      })
      .where(eq(mailerIdentities.id, identityId))
      .execute()

    return { id: identityId }
  }

  async delete(identityId: string) {
    await this.database
      .delete(mailerIdentities)
      .where(eq(mailerIdentities.id, identityId))

    return { id: identityId }
  }

  async decryptRsaPrivateKey(teamConfigurationKey: string, privateKey: string) {
    const decryptedConfigurationKey = new Secret(
      new Encryption({
        secret: makeEnv().APP_KEY,
      }).decrypt<string>(teamConfigurationKey),
    ) as Secret<string>

    const encryption = new Encryption({ secret: decryptedConfigurationKey })

    return {
      privateKey: new Secret(encryption.decrypt<string>(privateKey)),
    }
  }

  async encryptRsaPrivateKey(
    teamConfigurationKey: string,
    privateKey: Secret<string>,
  ) {
    const decryptedConfigurationKey = new Secret(
      new Encryption({
        secret: makeEnv().APP_KEY,
      }).decrypt<string>(teamConfigurationKey),
    ) as Secret<string>

    const encryption = new Encryption({ secret: decryptedConfigurationKey })

    return {
      privateKey: new Secret(encryption.encrypt(privateKey.release())),
    }
  }
}
