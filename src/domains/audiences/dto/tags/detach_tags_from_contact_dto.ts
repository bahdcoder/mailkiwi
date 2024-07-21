import {
  objectAsync,
  array,
  string,
  pipeAsync,
  checkAsync,
  InferInput,
} from "valibot"
import { makeDatabase } from "@/infrastructure/container.js"
import { tags } from "@/infrastructure/database/schema/schema.js"
import { inArray } from "drizzle-orm"

export const DetachTagsFromContactDto = objectAsync({
  tagIds: pipeAsync(
    array(string()),
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
