import { inArray } from 'drizzle-orm'
import {
  type InferInput,
  array,
  boolean,
  checkAsync,
  maxLength,
  minLength,
  nonEmpty,
  object,
  objectAsync,
  optional,
  picklist,
  pipe,
  pipeAsync,
  record,
  string,
} from 'valibot'

import { tags } from '#root/database/schema.js'

import { makeDatabase } from '#root/core/shared/container/index.js'

const PropertiesObjectSchema = record(
  string(),
  object({
    id: string(),
    label: string(),
    type: picklist(['boolean', 'float', 'text', 'date']),
  }),
  'Please provide a valid object of custom properties.',
)

export const UpdateContactImportSettingsSchema = objectAsync({
  subscribeAllContacts: optional(boolean()),
  updateExistingContacts: optional(boolean()),
  tags: array(pipe(string(), minLength(4), maxLength(50))), // new tags to be created
  tagIds: pipeAsync(
    array(string()),
    checkAsync(async (input) => {
      const database = makeDatabase()

      if (input.length === 0) {
        return true
      }

      const existingTags = await database.query.tags.findMany({
        where: inArray(tags.id, input),
      })

      return existingTags.length === input.length
    }, 'One or more of the provided tag Ids is invalid.'),
  ), // existing tags in the database
  propertiesMap: objectAsync({
    firstName: optional(string()),
    lastName: optional(string()),
    email: pipe(string('Please match the email property.'), nonEmpty()),
    customProperties: optional(PropertiesObjectSchema),
  }),
})

export type UpdateContactImportSettingsDto = InferInput<
  typeof UpdateContactImportSettingsSchema
>
