import type { DrizzleClient } from '#root/database/client.js'

import { makeContainerMakers, ContainerKey } from '@kibamail/framework'

const { makeApp, makeDatabase, makeRedis, makeDatabaseConnection, makeLogger } = makeContainerMakers<DrizzleClient>()

export { makeApp, makeDatabase, makeRedis, makeDatabaseConnection, makeLogger, ContainerKey }
