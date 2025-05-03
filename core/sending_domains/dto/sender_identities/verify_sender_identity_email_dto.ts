import { type InferInput, objectAsync, pipe, regex, string } from 'valibot'

/**
 * Schema for verifying a sender identity email.
 *
 * This schema validates the verification code input, ensuring:
 * - The code is a 6-digit number
 * - The format matches the expected pattern for verification codes
 */
export const VerifySenderIdentityEmailSchema = objectAsync({
  code: pipe(
    string(),
    regex(/^\d{6}$/, 'Please enter a valid 6-digit verification code'),
  ),
})

export type VerifySenderIdentityEmailDto = InferInput<
  typeof VerifySenderIdentityEmailSchema
>
