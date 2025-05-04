import { eq } from 'drizzle-orm'
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

import { broadcastGroups } from '@/database/schema.js'

import { makeDatabase } from '@/shared/container/index.js'

/**
 * Schema for creating a new broadcast campaign.
 *
 * This schema validates the input for creating a broadcast, ensuring:
 * 1. The broadcast has a non-empty name
 * 2. The broadcast group exists in the database
 * 3. The sender identity (if provided) is a valid string
 *
 * The validation includes an asynchronous check to verify that the
 * broadcast group exists, which prevents creating broadcasts in
 * non-existent groups and maintains data integrity.
 */
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
