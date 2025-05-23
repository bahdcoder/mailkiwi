import { eq } from 'drizzle-orm'
import {
  type InferInput,
  checkAsync,
  objectAsync,
  optional,
  pipeAsync,
  regex,
  string,
} from 'valibot'

import { websites } from '#root/database/schema.js'

import { makeDatabase } from '#root/core/shared/container/index.js'

/**
 * Schema for creating a new audience.
 *
 * This schema validates the input for creating an audience, ensuring:
 * - The audience has an optional name
 * - The slug (used for website URLs) is properly formatted and unique
 */
export const CreateAudienceSchema = objectAsync({
  name: optional(string('Audience name must be a text value')),
  slug: pipeAsync(
    string('Slug must be a text value'),
    regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug must contain only lowercase letters, numbers, and hyphens (e.g., my-audience)',
    ),
    checkAsync(async (slug) => {
      if (!slug) {
        return true
      }

      const database = makeDatabase()

      const exists = await database
        .select({ slug: websites.slug })
        .from(websites)
        .where(eq(websites.slug, slug))
        .limit(1)

      return exists.length === 0
    }, 'This slug is already in use. Please choose a different slug for your audience website (e.g., my-newsletter, company-updates).'),
  ),
})

export type CreateAudienceDto = InferInput<typeof CreateAudienceSchema>
