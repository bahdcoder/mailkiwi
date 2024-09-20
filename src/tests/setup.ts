import { Ignitor } from "@/api/ignitor/ignitor_api.js"

import { refreshDatabase } from "@/tests/mocks/teams/teams.js"

await new Ignitor().boot().start()

await refreshDatabase()
