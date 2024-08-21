import { Ignitor } from '@/boot/ignitor.js'

import { refreshDatabase } from '@/tests/mocks/teams/teams.js'

const ignitor = await new Ignitor().boot().start()

await refreshDatabase()
