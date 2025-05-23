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

import { sendingDomains } from '#root/database/schema.js'

import { makeDatabase } from '#root/core/shared/container/index.js'

/**
 * Schema for creating a new sending domain.
 *
 * This schema validates the input for creating a sending domain, ensuring:
 * - The domain name is properly formatted (e.g., example.com)
 * - The domain is not already registered in the system
 * - The product type is valid (engage for marketing, send for transactional)
 */
export const CreateSendingDomainSchema = objectAsync({
  name: pipeAsync(
    string('Domain name must be a text value'),
    regex(
      /^(?!:\/\/)([a-zA-Z0-9-_]+\.)+[a-zA-Z]{2,}$/,
      'Please enter a valid domain name (e.g., example.com)',
    ),
    checkAsync(async (name) => {
      const database = makeDatabase()

      const sendingDomainExists = await database.query.sendingDomains.findFirst({
        where: eq(sendingDomains.name, name),
      })

      return sendingDomainExists === undefined
    }, 'This domain is already registered in the system. Please use a different domain or contact support if you believe this is an error.'),
  ),
  product: optional(
    picklist(
      ['engage', 'send'],
      'Product must be either "engage" (for marketing emails) or "send" (for transactional emails)',
    ),
  ),
})

export type CreateSendingDomainDto = InferInput<typeof CreateSendingDomainSchema>
