import { eq } from 'drizzle-orm'
import {
  type InferInput,
  checkAsync,
  objectAsync,
  optional,
  pipeAsync,
  string,
  unknown,
} from 'valibot'

import { audiences, emails, tags } from '#root/database/schema.js'

import { makeDatabase } from '#root/core/shared/container/index.js'

export const UpdateAutomationStepDto = pipeAsync(
  objectAsync({
    configuration: unknown(),
    emailId: pipeAsync(
      optional(string()),
      checkAsync(async (input) => {
        if (!input) return true

        const database = makeDatabase()

        const existingEmail = await database.query.emails.findFirst({
          where: eq(emails.id, input),
        })

        return existingEmail !== undefined
      }, 'The emailId must reference a valid email.'),
    ),
    audienceId: pipeAsync(
      optional(string()),
      checkAsync(async (input) => {
        if (!input) return true

        const database = makeDatabase()

        const existingAudience = await database.query.audiences.findFirst({
          where: eq(audiences.id, input),
        })

        return existingAudience !== undefined
      }, 'The audienceId must reference a valid audience.'),
    ),
    tagId: pipeAsync(
      optional(string()),
      checkAsync(async (input) => {
        if (!input) return true

        const database = makeDatabase()

        const existingTag = await database.query.tags.findFirst({
          where: eq(tags.id, input),
        })

        return existingTag !== undefined
      }, 'The tagId must reference a valid tag.'),
    ),
  }),
  checkAsync(async () => {
    return true
  }),
)

export type UpdateAutomationStepDto = InferInput<typeof UpdateAutomationStepDto>
