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

export const DetachTagsFromContactDto = objectAsync({
  tagIds: pipeAsync(
    array(string()),
    checkAsync(async (input) => {
      const database = makeDatabase()
      const existingTags = await database.query.tags.findMany({
        where: inArray(tags.id, input),
      })

      return input.length === existingTags.length
    }, 'One or more of the provided tag IDs is invalid.'),
  ),
})

export type DetachTagsFromContactDto = InferInput<typeof DetachTagsFromContactDto>
