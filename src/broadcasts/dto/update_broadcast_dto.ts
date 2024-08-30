import { and, count, eq, inArray } from "drizzle-orm"
import type { CSSProperties } from "react"
import {
  type InferInput,
  array,
  boolean,
  check,
  checkAsync,
  email,
  maxLength,
  minLength,
  nonEmpty,
  number,
  object,
  objectAsync,
  optional,
  pipe,
  pipeAsync,
  string,
} from "valibot"

import {
  abTestVariants,
  audiences,
  segments,
} from "@/database/schema/schema.js"

import { makeDatabase } from "@/shared/container/index.js"

import { isDateInPast } from "@/utils/dates.js"

const emailContentFields = {
  fromName: optional(string()),
  fromEmail: optional(pipe(string(), email())),
  replyToEmail: optional(pipe(string(), email())),
  replyToName: optional(string()),

  contentJson: optional(string()),
  contentText: optional(string()),
  contentHtml: optional(string()),

  subject: optional(string()),

  previewText: optional(string()),
}

const EmailContent = object({
  ...emailContentFields,
})

const EmailContentVariant = object({
  ...emailContentFields,

  // for ab tests email content variants
  name: pipe(string(), nonEmpty()),
  weight: number(),

  // only when updating a variant email content.
  abTestVariantId: optional(string()),
})

export const UpdateBroadcastDto = pipeAsync(
  objectAsync({
    name: optional(string()),

    emailContent: optional(EmailContent),

    emailContentVariants: optional(
      pipe(array(EmailContentVariant), minLength(1), maxLength(5)),
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
      }, "sendAt cannot be in the past."),
    ),
    waitingTimeToPickWinner: optional(number()), // in hours
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
  }, "The Segment provided must part of the audience provided."),
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
  }, "One or more email content variants provided have an invalid ID."),
  check((input) => {
    if (
      !input.emailContentVariants ||
      input.emailContentVariants.length === 0
    ) {
      return true
    }

    const sum = input.emailContentVariants.reduce((acc, variant) => {
      return acc + variant.weight
    }, 0)

    return sum < 100
  }, "The sum of all ab test variant weights must be less than 100."),
)

export type EmailContentVariant = InferInput<typeof EmailContentVariant>

export type UpdateBroadcastDto = InferInput<typeof UpdateBroadcastDto>
