import { eq } from 'drizzle-orm'
import {
  type InferInput,
  checkAsync,
  nonEmpty,
  objectAsync,
  pipe,
  pipeAsync,
  string,
} from 'valibot'

import { broadcastGroups } from '@/database/schema.js'

import { makeDatabase } from '@/shared/container/index.js'

export const CreateBroadcastDto = objectAsync({
  name: pipe(string(), nonEmpty()),
  broadcastGroupId: pipeAsync(
    string(),
    checkAsync(async (value) => {
      const database = makeDatabase()

      const broadcastGroup = await database.query.broadcastGroups.findFirst({
        where: eq(broadcastGroups.id, value),
      })

      return broadcastGroup !== undefined
    }),
  ),
})

export type CreateBroadcastDto = InferInput<typeof CreateBroadcastDto>
