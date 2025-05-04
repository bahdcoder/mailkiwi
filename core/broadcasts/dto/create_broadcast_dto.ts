import { and, eq } from 'drizzle-orm'
import {
  type InferInput,
  checkAsync,
  nonEmpty,
  objectAsync,
  optional,
  pipe,
  pipeAsync,
  string,
} from 'valibot'

import { broadcastGroups, senderIdentities } from '@/database/schema.js'

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
  senderIdentityId: optional(string()),
})

export type CreateBroadcastDto = InferInput<typeof CreateBroadcastDto>
