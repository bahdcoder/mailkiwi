import { type InferInput, object, pipe, regex, string } from 'valibot'

/**
 * Schema for confirming an email change with verification code.
 *
 * This schema validates the 6-digit verification code that was sent to the
 * user's new email address. The validation ensures:
 * - The verification code is provided as a string or number
 * - The code is exactly 6 digits
 * - Required field validation
 *
 * The actual code verification (expiration, correctness) is handled
 * in the repository layer using existing email verification infrastructure.
 */
export const ConfirmEmailChangeSchema = object({
  code: pipe(
    string('Verification code is required'),
    regex(/^\d{6}$/, 'Verification code must be exactly 6 digits'),
  ),
})

export type ConfirmEmailChangeDto = InferInput<typeof ConfirmEmailChangeSchema>
