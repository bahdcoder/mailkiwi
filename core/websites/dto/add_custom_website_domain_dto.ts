import { eq } from 'drizzle-orm'
import {
  type InferInput,
  checkAsync,
  objectAsync,
  optional,
  picklist,
  pipeAsync,
  regex,
  string,
} from 'valibot'

import { websites } from '@/database/schema.js'

import { makeDatabase } from '@/shared/container/index.js'

export const AddCustomWebsiteDomainSchema = objectAsync({
  domain: pipeAsync(
    string(),
    regex(/^(?!:\/\/)([a-zA-Z0-9-_]+\.)+[a-zA-Z]{2,}$/),
    checkAsync(async (domain) => {
      const database = makeDatabase()

      const exists = await database
        .select({ websiteDomain: websites.websiteDomain })
        .from(websites)
        .where(eq(websites.websiteDomain, domain))
        .limit(1)

      return exists.length === 0
    }, 'A website with this domain already exists. Please choose another domain for your newsletter website.'),
  ),
})

export type AddCustomWebsiteDomainDto = InferInput<typeof AddCustomWebsiteDomainSchema>
