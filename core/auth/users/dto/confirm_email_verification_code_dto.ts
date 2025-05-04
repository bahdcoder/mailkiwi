import { type InferInput, objectAsync, pipe, regex, string } from 'valibot'

/**
 * Schema for confirming an email verification code.
 *
 * This schema validates the verification code input, ensuring:
 * - The code is a 6-digit number
 * - The format matches the expected pattern for verification codes
 *
 * Email verification is a critical security step that confirms
 * the user has access to the email address they registered with.
 */
export const ConfirmEmailVerificationCodeSchema = objectAsync({
  code: pipe(
    string('Verification code must be a text value'),
    regex(
      /^\d{6}$/,
      'Please enter the 6-digit verification code sent to your email address',
    ),
  ),
})

export type ConfirmEmailVerificationCodeDto = InferInput<
  typeof ConfirmEmailVerificationCodeSchema
>
