import {
  objectAsync,
  array,
  string,
  checkAsync,
  pipe,
  pipeAsync,
  InferInput,
} from "valibot"
import { makeDatabase } from "@/infrastructure/container.js"
import { tags } from "@/infrastructure/database/schema/schema.js"
import { eq, inArray } from "drizzle-orm"

export const AttachTagsToContactDto = objectAsync({
  tags: pipeAsync(
    array(string()),
    checkAsync(async (input) => {
      const database = makeDatabase()

      const existingTags = await database.query.tags.findMany({
        where: inArray(tags.id, input),
      })

      return existingTags.length === input.length
    }, "One or more of the provided tag IDs is invalid."),
  ),
})

export type AttachTagsToContactDto = InferInput<typeof AttachTagsToContactDto>
