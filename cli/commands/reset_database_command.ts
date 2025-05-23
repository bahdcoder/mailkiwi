import { command } from '@drizzle-team/brocli'

import { makeLogger } from '#root/core/shared/container/index.js'
import { refreshDatabase } from '#root/core/tests/mocks/teams/teams.js'

export const resetDatabaseCommand = command({
  name: 'reset_database',
  desc: 'Clear data in all database tables.',
  async transform(opts) {
    return opts
  },
  async handler() {
    const logger = makeLogger()
    await refreshDatabase()

    logger.info('👍 Database reset successfully.')
  },
})
