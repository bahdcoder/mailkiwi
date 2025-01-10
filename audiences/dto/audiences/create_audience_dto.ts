import { eq } from "drizzle-orm"
import {
  type InferInput,
  checkAsync,
  objectAsync,
  optional,
  pipeAsync,
  regex,
  string,
} from "valibot"

import { websites } from "@/database/schema.js"

import { makeDatabase } from "@/shared/container/index.js"

export const CreateAudienceSchema = objectAsync({
  name: optional(string()),
  slug: pipeAsync(
    string(),
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
})

export type CreateAudienceDto = InferInput<typeof CreateAudienceSchema>
