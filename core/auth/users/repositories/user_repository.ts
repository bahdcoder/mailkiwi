import type { DrizzleClient } from '#root/database/client.js'
import { oauth2Accounts, teamMemberships, teams, users } from '#root/database/schema.js'
import { Cache } from '#root/core/shared/cache/cache.js'
import { appEnv, type AppEnvVariables } from '#root/core/app/env/app_env'
import { makeDatabase } from '#root/core/shared/container/index.js'

import { UserRepository as FrameworkUserRepository } from '@kibamail/framework'

export class UserRepository extends FrameworkUserRepository<
  typeof teams,
  typeof teamMemberships,
  typeof users,
  typeof oauth2Accounts,
  DrizzleClient,
  Cache,
  AppEnvVariables
> {
  constructor() {
    super(
      teams,
      teamMemberships,
      users,
      oauth2Accounts,
      makeDatabase(),
      new Cache(),
      appEnv,
    )
  }
}
