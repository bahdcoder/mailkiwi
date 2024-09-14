import { inArray } from "drizzle-orm"
import {
  type InferInput,
  array,
  boolean,
  checkAsync,
  maxLength,
  minLength,
  nonEmpty,
  number,
  objectAsync,
  optional,
  pipe,
  pipeAsync,
  string,
} from "valibot"

import { tags } from "@/database/schema/schema.ts"

import { makeDatabase } from "@/shared/container/index.ts"

export const UpdateContactImportSettings = objectAsync({
  subscribeAllContacts: optional(boolean()),
  updateExistingContacts: optional(boolean()),
  tags: array(pipe(string(), minLength(4), maxLength(50))), // new tags to be created
  tagIds: pipeAsync(
    array(number()),
    checkAsync(async (input) => {
      const database = makeDatabase()

      if (input.length === 0) {
        return true
      }

      const existingTags = await database.query.tags.findMany({
        where: inArray(tags.id, input),
      })

      return existingTags.length === input.length
    }, "One or more of the provided tag Ids is invalid."),
  ), // existing tags in the database
  attributesMap: objectAsync({
    firstName: pipe(
      string("Please define the first name attribute."),
      nonEmpty(),
    ),
    lastName: pipe(
      string("Please define the last name attribute."),
      nonEmpty(),
    ),
    email: pipe(string("Please define the email attribute."), nonEmpty()),
    attributes: array(string(), "Please define a list of attributes."),
  }),
})

export type UpdateContactImportSettingsDto = InferInput<
  typeof UpdateContactImportSettings
>
