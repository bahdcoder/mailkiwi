import { type InferInput, email, object, pipe, string } from 'valibot'

/**
 * Schema for user registration.
 *
 * This schema validates the initial registration input, ensuring:
 * - The email is properly formatted
 *
 * This is the first step in the registration process, followed by
 * email verification, password setting, and profile completion.
 */
export const CreateUserSchema = object({
  email: pipe(
    string('Email must be a text value'),
    email('Please provide a valid email address in the format example@domain.com'),
  ),
})

export type CreateUserDto = InferInput<typeof CreateUserSchema>
