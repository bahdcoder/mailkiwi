import { type InferInput, email, object, pipe, string } from 'valibot'

/**
 * Schema for initiating an email change request.
 *
 * This schema validates the new email address that the user wants to change to,
 * ensuring it meets proper email format requirements. The validation includes:
 * - Proper email format validation
 * - Required field validation
 *
 * Additional business logic validation (uniqueness, different from current email)
 * is handled in the controller layer to provide more specific error messages.
 */
export const InitiateEmailChangeSchema = object({
  email: pipe(
    string('Email must be a text value'),
    email('Please provide a valid email address in the format example@domain.com'),
  ),
})

export type InitiateEmailChangeDto = InferInput<typeof InitiateEmailChangeSchema>
