import { makeDatabase } from '@/infrastructure/container.js'
import { audiences, segments } from '@/infrastructure/database/schema/schema.js'
import { isDateInPast } from '@/utils/dates.js'
import { and, eq } from 'drizzle-orm'
import {
  type InferInput,
  boolean,
  check,
  checkAsync,
  email,
  objectAsync,
  optional,
  pipe,
  pipeAsync,
  string,
  object,
} from 'valibot'

export const UpdateBroadcastDto = pipeAsync(
  objectAsync({
    name: optional(string()),

    emailContent: optional(
      object({
        fromName: optional(string()),
        fromEmail: optional(pipe(string(), email())),
        replyToEmail: optional(pipe(string(), email())),
        replyToName: optional(string()),

        contentJson: optional(string()),
        contentText: optional(string()),
        contentHtml: optional(string()),

        subject: optional(string()),

        previewText: optional(string()),
      }),
    ),

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

    segmentId: pipeAsync(
      optional(string()),
      checkAsync(async (value) => {
        if (!value) return true

        const database = makeDatabase()

        const segment = await database.query.segments.findFirst({
          where: eq(segments.id, value),
        })

        return segment !== undefined
      }),
    ),

    trackClicks: optional(boolean()),
    trackOpens: optional(boolean()),

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
  }),
  checkAsync(async (input) => {
    if (!input.audienceId || !input.segmentId) return true

    const database = makeDatabase()

    const segment = await database.query.segments.findFirst({
      where: and(
        eq(segments.id, input.segmentId),
        eq(segments.audienceId, input.audienceId),
      ),
    })

    return segment !== undefined
  }, 'The Segment provided must part of the audience provided.'),
)

export type UpdateBroadcastDto = InferInput<typeof UpdateBroadcastDto>
