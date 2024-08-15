import { Secret } from '@poppinss/utils'
import { type SQLWrapper, and, eq } from 'drizzle-orm'

import { BaseRepository } from '@/shared/repositories/base_repository.js'
import type { MailerConfiguration } from '@/shared/types/mailer.js'
import { Encryption } from '@/shared/utils/encryption/encryption.js'
import type { CreateMailerDto } from '@/teams/dto/mailers/create_mailer_dto.js'
import type { UpdateMailerDto } from '@/teams/dto/mailers/update_mailer_dto.js'
import { makeDatabase, makeEnv } from '@/shared/container/index.js'
import type { DrizzleClient } from '@/database/client.js'
import { mailers } from '@/database/schema/schema.js'
import type {
  Mailer,
  Team,
  UpdateSetMailerInput,
} from '@/database/schema/types.js'

export class MailerRepository extends BaseRepository {
  defaultConfigurationPayload: MailerConfiguration = {
    accessKey: new Secret(''),
    accessSecret: new Secret(''),
    region: '' as MailerConfiguration['region'],
    domain: '',
    email: '',
  }

  constructor(protected database: DrizzleClient = makeDatabase()) {
    super()
  }

  async create(payload: CreateMailerDto, team: Team) {
    const id = this.cuid()

    const { configuration, ...rest } = payload

    await this.database.insert(mailers).values({
      ...rest,
      id,
      configuration: this.getEncryptedConfigurationPayload(
        {
          ...this.defaultConfigurationPayload,
          ...configuration,
        },
        team.configurationKey,
      ),
      teamId: team.id,
    })

    return this.findById(id)
  }

  async findById(mailerId: string, args?: SQLWrapper[]) {
    const mailer = await this.database.query.mailers.findFirst({
      where: and(eq(mailers.id, mailerId), ...(args ?? [])),
    })

    return mailer as Mailer
  }

  async delete(mailer: Mailer) {
    await this.database.delete(mailers).where(eq(mailers.id, mailer.id))

    return { id: mailer.id }
  }

  async findMany() {
    return await this.database.query.mailers.findMany({})
  }

  async setMailerStatus(mailer: Mailer, status: Mailer['status']) {
    await this.database
      .update(mailers)
      .set({ status })
      .where(eq(mailers.id, mailer.id))

    return { id: mailer.id }
  }

  async update(
    mailer: Mailer,
    updatePayload: Partial<UpdateMailerDto> &
      Omit<UpdateSetMailerInput, 'configuration'>,
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

    await this.database
      .update(mailers)
      .set({
        configuration: encryptedConfiguration,
        ...payload,
      })
      .where(eq(mailers.id, mailer.id))

    return this.findById(mailer.id)
  }

  getDecryptedConfiguration(
    configuration: string,
    encryptedConfigurationKey: string,
  ) {
    const configurationKey = new Secret(
      new Encryption({
        secret: makeEnv().APP_KEY,
      }).decrypt<string>(encryptedConfigurationKey),
    ) as Secret<string>

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
      }).decrypt<string>(encryptedConfigurationKey),
    ) as Secret<string>

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
