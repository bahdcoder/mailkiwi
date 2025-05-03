import { eq } from 'drizzle-orm'
import {
  type InferInput,
  email,
  maxLength,
  minLength,
  nonEmpty,
  objectAsync,
  optional,
  pipe,
  regex,
  string,
} from 'valibot'

/**
 * Schema for updating an existing sender identity.
 *
 * This schema validates the input for updating a sender identity, ensuring:
 * - All fields are optional to allow partial updates
 * - The name is properly formatted if provided
 * - The email local part is valid if provided
 * - The sending domain exists and is valid if provided
 * - The reply-to email is properly formatted if provided
 */
export const UpdateSenderIdentitySchema = objectAsync({
  name: optional(
    pipe(
      string(),
      nonEmpty('Please provide a name for this sender identity'),
      minLength(3, 'Name must be at least 3 characters'),
      maxLength(100, 'Name must be less than 100 characters'),
    ),
  ),

  email: optional(
    pipe(
      string(),
      nonEmpty('Please provide the email local part'),
      regex(/^[a-zA-Z0-9._%+-]+$/, 'Invalid email local part format'),
      maxLength(80, 'Email local part must be less than 80 characters'),
    ),
  ),

  sendingDomainId: optional(string()),

  replyToEmail: optional(pipe(string(), email('Please provide a valid reply-to email'))),
})

export type UpdateSenderIdentityDto = InferInput<typeof UpdateSenderIdentitySchema>
