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

export const AddCustomNewsletterDomainSchema = objectAsync({
  domain: pipeAsync(
    string(),
    regex(/^(?!:\/\/)([a-zA-Z0-9-_]+\.)+[a-zA-Z]{2,}$/),
    checkAsync(async function (domain) {
      const database = makeDatabase()

      const exists = await database
        .select({ websiteDomain: newsletterWebsites.websiteDomain })
        .from(newsletterWebsites)
        .where(eq(newsletterWebsites.websiteDomain, domain))
        .limit(1)

      return exists.length === 0
    }, "A website with this domain already exists. Please choose another domain for your newsletter website."),
  ),
})

export type AddCustomNewsletterDomainDto = InferInput<
  typeof AddCustomNewsletterDomainSchema
>
