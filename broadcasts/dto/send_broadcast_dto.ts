import { eq } from "drizzle-orm"
import { DateTime } from "luxon"
import {
  type InferInput,
  any,
  boolean,
  check,
  checkAsync,
  date,
  email,
  maxLength,
  minLength,
  nonEmpty,
  nullable,
  number,
  object,
  objectAsync,
  optional,
  pipe,
  pipeAsync,
  record,
  string,
} from "valibot"

import { audiences } from "@/database/schema.js"

import { makeDatabase } from "@/shared/container/index.js"

export const SendBroadcastEmailContentSchema = object({
  subject: pipe(
    string("Please provide a valid subject"),
    nonEmpty(),
    minLength(8),
    maxLength(120),
  ),
  fromName: pipe(string('Please provide a valid "from" name'), nonEmpty()),
  fromEmail: pipe(string('Please provide a valid "from" email'), nonEmpty()),
  replyToEmail: pipe(
    string("Please provide a valid 'reply to' email"),
    nonEmpty(),
    email(),
  ),

  contentJson: record(string(), any()),

  previewText: pipe(string("Please provide a valid preview text"), nonEmpty()),
})

export const SendBroadcastSchema = objectAsync({
  name: pipe(string(), nonEmpty(), minLength(8), maxLength(120)),

  audienceId: pipeAsync(
    string(),
    checkAsync(async (value) => {
      const database = makeDatabase()

      const audience = await database.query.audiences.findFirst({
        where: eq(audiences.id, value),
      })

      return audience !== undefined
    }),
  ),

  trackClicks: optional(nullable(boolean())),
  trackOpens: optional(nullable(boolean())),

  emailContent: SendBroadcastEmailContentSchema,

  sendAt: pipeAsync(
    nullable(optional(string())),
    check((input) => {
      if (!input) return true

      const date = new Date(input)

      if (Number.isNaN(date.getTime())) {
        return false
      }

      const dateTime = DateTime.fromJSDate(date).diffNow("hours")

      return dateTime.hours > 1
    }, "You may schedule to send this broadcast at least on hour in the future."),
  ),
})

export type SendBroadcastDto = InferInput<typeof SendBroadcastSchema>
