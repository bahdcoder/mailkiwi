import { type InferInput, maxLength, nonEmpty, objectAsync, pipe, string } from 'valibot'

/**
 * Schema for setting user and team names during registration.
 *
 * This schema validates the profile information, ensuring:
 * - First and last names are provided and within length limits
 * - Organization name is provided and within length limits
 *
 * This information is used to personalize the user experience
 * and set up the initial team for the user's account.
 */
export const SetUserNameSchema = objectAsync({
  firstName: pipe(
    string('First name must be a text value'),
    nonEmpty('Please provide your first name to personalize your account'),
    maxLength(50, 'First name must be less than 50 characters to fit in our system'),
  ),
  lastName: pipe(
    string('Last name must be a text value'),
    nonEmpty('Please provide your last name to complete your profile'),
    maxLength(50, 'Last name must be less than 50 characters to fit in our system'),
  ),
  teamName: pipe(
    string('Organization name must be a text value'),
    nonEmpty('Please provide your organization name to set up your team'),
    maxLength(
      50,
      'Organization name must be less than 50 characters to fit in our system',
    ),
  ),
})

export type SetUserNameDto = InferInput<typeof SetUserNameSchema>
