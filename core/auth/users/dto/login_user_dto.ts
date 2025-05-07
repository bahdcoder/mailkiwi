import { type InferInput, email, object, pipe, string } from 'valibot'

/**
 * Schema for user login validation.
 *
 * This schema validates the login form input, ensuring:
 * - The email is properly formatted
 * - A password is provided
 */
export const LoginUserSchema = object({
  email: pipe(
    string('Email must be a text value'),
    email('Please enter a valid email address'),
  ),
  password: string('Please enter your password'),
})

export type LoginUserDto = InferInput<typeof LoginUserSchema>
