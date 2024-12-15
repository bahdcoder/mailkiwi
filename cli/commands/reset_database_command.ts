import { command } from "@drizzle-team/brocli"

import { refreshDatabase } from "@/tests/mocks/teams/teams.js"

export const resetDatabaseCommand = command({
  name: "reset_database",
  desc: "Clear data in all database tables.",
  async transform(opts) {
    return opts
  },
  async handler() {
    await refreshDatabase()

    console.log("👍 Database reset successfully.")
  },
})
