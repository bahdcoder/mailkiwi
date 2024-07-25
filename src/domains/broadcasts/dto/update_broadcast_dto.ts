import { makeDatabase } from '@/infrastructure/container.ts'
import { audiences } from '@/infrastructure/database/schema/schema.ts'
import { isDateInPast } from '@/utils/dates.ts'
import { eq } from 'drizzle-orm'
import {
  type InferInput,
  boolean,
  check,
  checkAsync,
  date,
  email,
  number,
  object,
  objectAsync,
  optional,
  pipe,
  pipeAsync,
  string,
} from 'valibot'

export const UpdateBroadcastDto = objectAsync({
  name: optional(string()),
  fromName: optional(string()),
  fromEmail: optional(pipe(string(), email())),
  replyToEmail: optional(pipe(string(), email())),
  replyToName: optional(string()),
  audienceId: pipeAsync(
    optional(string()),
    checkAsync(async (value) => {
      if (!value) return true
      const database = makeDatabase()

      const audience = await database.query.audiences.findFirst({
        where: eq(audiences.id, value),
      })

      return audience !== undefined
    }),
  ),

  trackClicks: optional(boolean()),
  trackOpens: optional(boolean()),

  contentJson: optional(string()),
  contentText: optional(string()),
  contentHtml: optional(string()),

  subject: optional(string()),

  previewText: optional(string()),

  sendAt: pipeAsync(
    optional(string()),
    check((input) => {
      if (!input) return true

      const date = new Date(input)

      return !Number.isNaN(date.getTime())
    }),
    checkAsync((input) => {
      if (!input) return true

      return isDateInPast(input) === false
    }, 'sendAt cannot be in the past.'),
  ),
})

export type UpdateBroadcastDto = InferInput<typeof UpdateBroadcastDto>
