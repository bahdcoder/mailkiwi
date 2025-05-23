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

import { websites } from '#root/database/schema.js'

import { makeDatabase } from '#root/core/shared/container/index.js'

/**
 * Schema for adding a custom domain to a newsletter website.
 *
 * This schema validates the input for adding a custom domain, ensuring:
 * - The domain name is properly formatted (e.g., newsletter.example.com)
 * - The domain is not already in use by another website in the system
 */
export const AddCustomWebsiteDomainSchema = objectAsync({
  domain: pipeAsync(
    string('Domain name must be a text value'),
    regex(
      /^(?!:\/\/)([a-zA-Z0-9-_]+\.)+[a-zA-Z]{2,}$/,
      'Please enter a valid domain name (e.g., newsletter.example.com)',
    ),
    checkAsync(async (domain) => {
      const database = makeDatabase()

      const exists = await database
        .select({ websiteDomain: websites.websiteDomain })
        .from(websites)
        .where(eq(websites.websiteDomain, domain))
        .limit(1)

      return exists.length === 0
    }, 'This domain is already in use by another newsletter website. Please choose a different domain or subdomain for your newsletter.'),
  ),
})

export type AddCustomWebsiteDomainDto = InferInput<typeof AddCustomWebsiteDomainSchema>
