import { command } from '@drizzle-team/brocli'

import { refreshDatabase } from '@/tests/mocks/teams/teams.js'
import { makeLogger } from '@/shared/container/index.js'

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
