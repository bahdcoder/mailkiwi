import { eq } from "drizzle-orm"
import {
  type InferInput,
  checkAsync,
  object,
  objectAsync,
  optional,
  picklist,
  pipeAsync,
  regex,
  string,
} from "valibot"

import { audiences } from "@/database/schema.js"

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
        .select({ slug: audiences.slug })
        .from(audiences)
        .where(eq(audiences.slug, slug))
        .limit(1)

      return exists.length === 0
    }),
  ),
  product: optional(picklist(["engage", "letters"])),
})

export type CreateAudienceDto = InferInput<typeof CreateAudienceSchema>
