import { eq } from "drizzle-orm"
import {
  type InferInput,
  checkAsync,
  objectAsync,
  optional,
  picklist,
  pipeAsync,
  regex,
  string,
} from "valibot"

import { newsletterWebsites } from "@/database/schema.js"

import { makeDatabase } from "@/shared/container/index.js"

export const CreateAudienceSchema = objectAsync({
  name: string(),
  slug: pipeAsync(
    optional(string()),
    regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    checkAsync(async function (slug) {
      if (!slug) {
        return true
      }

      const database = makeDatabase()

      const exists = await database
        .select({ slug: newsletterWebsites.slug })
        .from(newsletterWebsites)
        .where(eq(newsletterWebsites.slug, slug))
        .limit(1)

      return exists.length === 0
    }, "A website with this slug already exists. Please choose another subdomain for your website."),
  ),
  product: optional(picklist(["engage", "letters"])),
})

export type CreateAudienceDto = InferInput<typeof CreateAudienceSchema>
