import { eq } from "drizzle-orm"
import {
  type InferInput,
  check,
  checkAsync,
  objectAsync,
  optional,
  picklist,
  pipeAsync,
  regex,
  string,
} from "valibot"

import { websites } from "@/database/schema.js"

import { makeDatabase } from "@/shared/container/index.js"

export const CreateAudienceSchema = pipeAsync(
  objectAsync({
    name: optional(string()),
    slug: pipeAsync(
      optional(string()),
      regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
      checkAsync(async function (slug) {
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
      }, "A website with this slug already exists. Please choose another subdomain for your website."),
    ),
    product: picklist(["engage", "letters"]),
  }),
  check(function slugIsRequiredIfProductIsLetters(input) {
    if (input.product === "engage") {
      return true
    }

    if (input.slug) {
      return true
    }

    return false
  }, "Please provide a slug for your newsletter website."),
)

export type CreateAudienceDto = InferInput<typeof CreateAudienceSchema>
