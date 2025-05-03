import { eq } from 'drizzle-orm'
import {
  type InferInput,
  checkAsync,
  email,
  maxLength,
  minLength,
  nonEmpty,
  objectAsync,
  optional,
  pipe,
  pipeAsync,
  regex,
  string,
} from 'valibot'

import { container } from '@/utils/typi.js'
import { UUID_V1_REGEX } from '@/shared/utils/cuid/cuid.js'
import { SendingDomainRepository } from '@/sending_domains/repositories/sending_domain_repository.js'

/**
 * Schema for creating a new sender identity.
 *
 * This schema validates the input for creating a sender identity, ensuring:
 * - The name is properly formatted and not empty
 * - The email local part is valid (before the @ symbol)
 * - The sending domain exists and is valid
 * - The reply-to email is properly formatted (optional)
 */
export const CreateSenderIdentitySchema = objectAsync({
  name: pipe(
    string(),
    nonEmpty('Please provide a name for this sender identity'),
    minLength(3, 'Name must be at least 3 characters'),
    maxLength(100, 'Name must be less than 100 characters'),
  ),

  email: pipe(
    string(),
    nonEmpty('Please provide the email local part'),
    regex(/^[a-zA-Z0-9._%+-]+$/, 'Invalid email local part format'),
    maxLength(80, 'Email local part must be less than 80 characters'),
  ),

  sendingDomainId: pipeAsync(
    string(),
    checkAsync(async (sendingDomainId) => {
      if (!UUID_V1_REGEX.test(sendingDomainId)) {
        return false
      }

      const sendingDomain = await container
        .make(SendingDomainRepository)
        .findById(sendingDomainId)

      return !!sendingDomain
    }, 'The specified sending domain does not exist or is invalid.'),
  ),

  replyToEmail: optional(pipe(string(), email('Please provide a valid reply-to email'))),
})

export type CreateSenderIdentityDto = InferInput<typeof CreateSenderIdentitySchema>
