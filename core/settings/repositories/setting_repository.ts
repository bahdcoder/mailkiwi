import { appEnv } from '#root/core/app/env/app_env.js'

import type { InsertSetting } from '#root/database/database_schema_types.js'
import { settings } from '#root/database/schema.js'

import { makeDatabase } from '#root/core/shared/container/index.js'
import { BaseRepository } from '#root/core/shared/repositories/base_repository.js'
import { Encryption } from '#root/core/shared/utils/encryption/encryption.js'

export class SettingRepository extends BaseRepository {
  constructor(protected database = makeDatabase()) {
    super()
  }

  async get() {
    const [setting] = await this.database.select().from(settings).limit(1)

    if (setting) {
      const decryptedAcmeAccountIdentity = new Encryption(appEnv.APP_KEY)
        .decrypt(setting.acmeAccountIdentity)
        ?.release()

      if (decryptedAcmeAccountIdentity) {
        setting.acmeAccountIdentity = decryptedAcmeAccountIdentity
      }
    }

    return setting
  }

  async create(payload: InsertSetting) {
    const id = this.cuid()

    const exists = await this.get()

    if (exists) {
      return exists
    }

    const acmeAccountIdentity = new Encryption(appEnv.APP_KEY)
      .encrypt(payload.acmeAccountIdentity)
      .release()

    await this.database.insert(settings).values({
      id,
      acmeAccountIdentity,
    })

    return { id, acmeAccountIdentity }
  }
}
