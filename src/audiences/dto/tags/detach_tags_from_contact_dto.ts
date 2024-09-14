import { inArray } from "drizzle-orm"
import {
  type InferInput,
  array,
  checkAsync,
  number,
  objectAsync,
  pipeAsync,
} from "valibot"

import { tags } from "@/database/schema/schema.js"

import { makeDatabase } from "@/shared/container/index.js"

export const DetachTagsFromContactDto = objectAsync({
  tagIds: pipeAsync(
    array(number()),
    checkAsync(async (input) => {
      const database = makeDatabase()
      const existingTags = await database.query.tags.findMany({
        where: inArray(tags.id, input),
      })

      return input.length === existingTags.length
    }, "One or more of the provided tag IDs is invalid."),
  ),
})

export type DetachTagsFromContactDto = InferInput<
  typeof DetachTagsFromContactDto
>
