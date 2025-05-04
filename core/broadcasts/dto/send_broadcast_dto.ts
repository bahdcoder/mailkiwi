import { and, eq } from 'drizzle-orm'
import { DateTime } from 'luxon'
import {
  type InferInput,
  any,
  boolean,
  check,
  checkAsync,
  maxLength,
  minLength,
  nonEmpty,
  nullable,
  object,
  objectAsync,
  optional,
  pipe,
  pipeAsync,
  record,
  string,
  uuid,
} from 'valibot'

import { audiences, senderIdentities, sendingDomains } from '@/database/schema.js'

import { makeDatabase } from '@/shared/container/index.js'

/**
 * Schema for validating email content within a broadcast.
 *
 * This schema ensures that the email content meets quality standards:
 * 1. Subject line is between 8-120 characters (optimal for deliverability)
 * 2. Content JSON structure is present (for the email editor)
 * 3. Preview text is provided (important for inbox engagement)
 *
 * These validations help maintain email quality and improve the likelihood
 * of successful delivery and engagement.
 */
export const SendBroadcastEmailContentSchema = object({
  subject: pipe(
    string('Please provide a valid subject'),
    nonEmpty(),
    minLength(8),
    maxLength(120),
  ),
  contentJson: record(string(), any()),
  previewText: pipe(string('Please provide a valid preview text'), nonEmpty()),
})

/**
 * Schema for validating a broadcast send request.
 *
 * This comprehensive schema ensures that all required data for sending a broadcast
 * is present and valid. It performs several critical validations:
 *
 * 1. Broadcast name meets length requirements
 * 2. Target audience exists in the database
 * 3. Sending domain (if specified) exists and is configured for marketing emails
 * 4. Sender identity exists and is valid
 * 5. Email content meets quality standards
 * 6. Scheduled send time (if provided) is at least one hour in the future
 *
 * These validations help prevent errors in the email sending process and ensure
 * that broadcasts meet quality and deliverability standards before being queued.
 */
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

  sendingDomainId: pipeAsync(
    pipe(string(), uuid()),
    checkAsync(async (value) => {
      if (!value) return true

      const database = makeDatabase()

      const sendingDomain = await database.query.sendingDomains.findFirst({
        where: and(eq(sendingDomains.id, value), eq(sendingDomains.product, 'engage')),
      })

      return sendingDomain !== undefined
    }, 'The sending domain must be an engage domain'),
  ),

  senderIdentityId: pipeAsync(
    string(),
    checkAsync(async (value) => {
      const database = makeDatabase()

      const senderIdentity = await database.query.senderIdentities.findFirst({
        where: eq(senderIdentities.id, value),
      })

      return senderIdentity !== undefined
    }, 'The specified sender identity does not exist or is invalid.'),
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

      const dateTime = DateTime.fromJSDate(date).diffNow('hours')

      return dateTime.hours > 1
    }, 'You may schedule to send this broadcast at least on hour in the future.'),
  ),
})

export type SendBroadcastDto = InferInput<typeof SendBroadcastSchema>
