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

import { container } from '#root/core/utils/typi.js'
import { UUID_V1_REGEX } from '#root/core/shared/utils/cuid/cuid.js'
import { SendingDomainRepository } from '#root/core/sending_domains/repositories/sending_domain_repository.js'

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
    string('Name must be a text value'),
    nonEmpty(
      "Please provide a name for this sender identity - this will appear in your recipients' inboxes",
    ),
    minLength(3, 'Name must be at least 3 characters to be recognizable to recipients'),
    maxLength(
      100,
      'Name must be less than 100 characters to ensure compatibility with email clients',
    ),
  ),

  email: pipe(
    string('Email local part must be a text value'),
    nonEmpty('Please provide the email local part (the part before the @ symbol)'),
    regex(
      /^[a-zA-Z0-9._%+-]+$/,
      'Email local part can only contain letters, numbers, and the characters ._%+-',
    ),
    maxLength(
      80,
      'Email local part must be less than 80 characters to ensure compatibility with email servers',
    ),
  ),

  sendingDomainId: pipeAsync(
    string('Sending domain ID must be a text value'),
    checkAsync(async (sendingDomainId) => {
      if (!UUID_V1_REGEX.test(sendingDomainId)) {
        return false
      }

      const sendingDomain = await container
        .make(SendingDomainRepository)
        .findById(sendingDomainId)

      return !!sendingDomain
    }, 'The selected sending domain does not exist in your account. Please choose a valid sending domain.'),
  ),

  replyToEmail: optional(
    pipe(
      string('Reply-to email must be a text value'),
      email(
        'Please provide a valid reply-to email address in the format example@domain.com',
      ),
    ),
  ),
})

export type CreateSenderIdentityDto = InferInput<typeof CreateSenderIdentitySchema>
