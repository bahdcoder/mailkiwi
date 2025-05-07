import { type InferInput, objectAsync, pipe, regex, string } from 'valibot'

/**
 * Schema for setting a user's password during registration.
 *
 * This schema validates the password input, ensuring it meets
 * security requirements:
 * - Contains at least one uppercase letter
 * - Contains at least one lowercase letter
 * - Contains at least one number
 *
 * These requirements help ensure account security while still
 * being reasonable for users to remember.
 */
export const SetUserPasswordSchema = objectAsync({
  password: pipe(
    string('Password must be a text value'),
    regex(/[A-Z]/, 'Your password must contain at least one capital letter for security'),
    regex(
      /[a-z]/,
      'Your password must contain at least one lowercase letter for security',
    ),
    regex(/[0-9]/, 'Your password must contain at least one number for security'),
  ),
})

export type SetUserPasswordDto = InferInput<typeof SetUserPasswordSchema>
