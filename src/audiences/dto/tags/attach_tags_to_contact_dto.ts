import { eq, inArray } from "drizzle-orm"
import {
  type InferInput,
  array,
  checkAsync,
  objectAsync,
  pipe,
  pipeAsync,
  string,
} from "valibot"

import { tags } from "@/database/schema/schema.js"

import { makeDatabase } from "@/shared/container/index.js"

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

export type AttachTagsToContactDto = InferInput<
  typeof AttachTagsToContactDto
>
