import { and, count, eq, inArray } from 'drizzle-orm'
import {
  type InferInput,
  any,
  array,
  boolean,
  check,
  checkAsync,
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
  uuid,
} from 'valibot'

import {
  abTestVariants,
  audiences,
  segments,
  senderIdentities,
  sendingDomains,
} from '#root/database/schema.js'

import { makeDatabase } from '#root/core/shared/container/index.js'

import { isDateInPast } from '#root/core/utils/dates.js'
import { UUID_V1_REGEX } from '#root/core/shared/utils/cuid/cuid.js'

/**
 * Common fields for email content validation.
 *
 * These fields are used in both regular email content and A/B test variants.
 */
const emailContentFields = {
  contentJson: optional(record(string(), any(), 'Email content structure must be valid')),
  contentText: optional(string('Plain text content must be a string')),
  contentHtml: optional(string('HTML content must be a string')),

  subject: optional(
    pipe(
      string('Subject must be a text value'),
      minLength(4, 'Subject must be at least 4 characters long'),
      maxLength(128, 'Subject must be less than 128 characters to avoid truncation'),
    ),
  ),

  previewText: optional(
    pipe(
      string('Preview text must be a text value'),
      minLength(4, 'Preview text must be at least 4 characters long'),
      maxLength(
        128,
        'Preview text must be less than 128 characters to display properly in email clients',
      ),
    ),
  ),
}

const EmailContent = object({
  ...emailContentFields,
})

/**
 * Schema for A/B test email content variants.
 *
 * A/B test variants allow testing different email content versions
 * to determine which performs better with your audience.
 */
const EmailContentVariant = object({
  ...emailContentFields,

  // for ab tests email content variants
  name: pipe(
    string('Variant name must be a text value'),
    nonEmpty('Please provide a name for this A/B test variant'),
  ),
  weight: number(
    'Weight must be a number representing the percentage of recipients who will receive this variant',
  ),

  // only when updating a variant email content.
  abTestVariantId: optional(string('Variant ID must be a text value')),
})

/**
 * Schema for updating a broadcast campaign.
 *
 * This schema validates updates to broadcast settings, including:
 * - Basic information like name
 * - Email content for regular broadcasts or A/B test variants
 * - Audience and segment targeting
 * - Sending configuration (domain, identity, tracking)
 * - Scheduling information
 */
export const UpdateBroadcastDto = pipeAsync(
  objectAsync({
    name: optional(string('Broadcast name must be a text value')),

    emailContent: optional(EmailContent),

    emailContentVariants: optional(
      pipe(
        array(EmailContentVariant),
        minLength(1, 'At least one email content variant is required for A/B testing'),
        maxLength(5, 'A maximum of 5 variants is allowed for A/B testing'),
      ),
    ),

    audienceId: pipeAsync(
      optional(string('Audience ID must be a text value')),
      checkAsync(async (value) => {
        if (!value) return true
        const database = makeDatabase()

        const audience = await database.query.audiences.findFirst({
          where: eq(audiences.id, value),
        })

        return audience !== undefined
      }, 'The selected audience does not exist. Please choose a valid audience.'),
    ),

    sendingDomainId: pipeAsync(
      optional(
        pipe(
          string('Sending domain ID must be a text value'),
          uuid('Sending domain ID must be a valid UUID format'),
        ),
      ),
      checkAsync(async (value) => {
        if (!value) return true

        const database = makeDatabase()

        const sendingDomain = await database.query.sendingDomains.findFirst({
          where: eq(sendingDomains.id, value),
        })

        return sendingDomain !== undefined
      }, 'The selected sending domain does not exist. Please choose a valid sending domain.'),
    ),

    segmentId: pipeAsync(
      optional(
        nullable(
          pipe(
            string('Segment ID must be a text value'),
            uuid('Segment ID must be a valid UUID format'),
          ),
        ),
      ),
      checkAsync(async (value) => {
        if (!value) return true

        const database = makeDatabase()

        const segment = await database.query.segments.findFirst({
          where: eq(segments.id, value),
        })

        return segment !== undefined
      }, 'The selected segment does not exist. Please choose a valid segment.'),
    ),

    senderIdentityId: pipeAsync(
      optional(string('Sender identity ID must be a text value')),
      checkAsync(async (value) => {
        if (!value) return true

        if (!UUID_V1_REGEX.test(value)) {
          return false
        }

        const database = makeDatabase()

        const senderIdentity = await database.query.senderIdentities.findFirst({
          where: eq(senderIdentities.id, value),
        })

        return senderIdentity !== undefined
      }, 'The specified sender identity does not exist. Please select a valid sender identity from your account.'),
    ),

    trackClicks: optional(boolean('Click tracking must be a boolean value')),
    trackOpens: optional(boolean('Open tracking must be a boolean value')),

    sendAt: pipeAsync(
      optional(string('Schedule date must be a text value in ISO format')),
      check((input) => {
        if (!input) return true

        const date = new Date(input)

        return !Number.isNaN(date.getTime())
      }, 'Please provide a valid date and time for scheduling'),
      checkAsync((input) => {
        if (!input) return true

        return isDateInPast(input) === false
      }, 'Scheduled broadcasts must be set in the future. Please select a date and time that is at least six hours from now.'),
    ),
    waitingTimeToPickWinner: optional(number('Waiting time must be a number of hours')), // in hours
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
  }, 'The selected segment does not belong to the selected audience. Please choose a segment that is part of the audience you selected.'),
  checkAsync(async (input) => {
    if (!input.emailContentVariants) {
      return true
    }

    const variantIds = input.emailContentVariants
      .map((variant) => variant.abTestVariantId)
      .filter((id) => id) as string[]

    if (variantIds.length === 0) {
      return true
    }

    const database = makeDatabase()

    const [{ count: existingAbTestVariants }] = await database
      .select({ count: count() })
      .from(abTestVariants)
      .where(inArray(abTestVariants.id, variantIds))

    return existingAbTestVariants === variantIds.length
  }, 'One or more A/B test variants have invalid IDs. Please ensure all variants exist in the system.'),
  check((input) => {
    if (!input.emailContentVariants || input.emailContentVariants.length === 0) {
      return true
    }

    const sum = input.emailContentVariants.reduce((acc, variant) => {
      return acc + variant.weight
    }, 0)

    return sum < 100
  }, 'The total weight of all A/B test variants must be less than 100%. Please adjust the weights so they sum to less than 100.'),
)

export type EmailContentVariant = InferInput<typeof EmailContentVariant>

export type UpdateBroadcastDto = InferInput<typeof UpdateBroadcastDto>
