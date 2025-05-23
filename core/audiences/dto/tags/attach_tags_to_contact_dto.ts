import { inArray } from 'drizzle-orm'
import {
  type InferInput,
  array,
  checkAsync,
  objectAsync,
  pipeAsync,
  string,
} from 'valibot'

import { tags } from '#root/database/schema.js'

import { makeDatabase } from '#root/core/shared/container/index.js'

export const AttachTagsToContactDto = objectAsync({
  tags: pipeAsync(
    array(string()),
    checkAsync(async (input) => {
      const database = makeDatabase()

      const existingTags = await database.query.tags.findMany({
        where: inArray(tags.id, input),
      })

      return existingTags.length === input.length
    }, 'One or more of the provided tag IDs is invalid.'),
  ),
})

export type AttachTagsToContactDto = InferInput<typeof AttachTagsToContactDto>
