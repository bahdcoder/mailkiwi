import { type InferInput, object, pipe, regex, string } from 'valibot'

/**
 * Schema for changing a user's password.
 *
 * This schema validates the password change input, ensuring:
 * - Current password is provided
 * - New password meets security requirements (uppercase, lowercase, number)
 * - Password confirmation matches the new password
 *
 * The new password validation uses the same strict requirements as
 * the registration process to maintain consistent security standards.
 */
export const ChangePasswordSchema = object({
  password: string('Current password is required'),
  newPassword: pipe(
    string('New password must be a text value'),
    regex(
      /[A-Z]/,
      'Your new password must contain at least one capital letter for security',
    ),
    regex(
      /[a-z]/,
      'Your new password must contain at least one lowercase letter for security',
    ),
    regex(/[0-9]/, 'Your new password must contain at least one number for security'),
  ),
  confirmNewPassword: string('Please confirm your new password'),
})

export type ChangePasswordDto = InferInput<typeof ChangePasswordSchema>
