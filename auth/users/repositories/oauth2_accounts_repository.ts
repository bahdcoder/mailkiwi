import { oauth2Accounts } from '@/database/schema.js'

import { BaseRepository } from '@/shared/repositories/base_repository.js'

export class Oauth2AccountsRepository extends BaseRepository {

  accounts() {
    return this.crud(oauth2Accounts)
  }
}
