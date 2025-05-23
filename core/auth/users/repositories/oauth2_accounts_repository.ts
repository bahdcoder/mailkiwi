import { oauth2Accounts } from '#root/database/schema.js'

import { BaseRepository } from '#root/core/shared/repositories/base_repository.js'

export class Oauth2AccountsRepository extends BaseRepository {
  accounts() {
    return this.crud(oauth2Accounts)
  }
}
