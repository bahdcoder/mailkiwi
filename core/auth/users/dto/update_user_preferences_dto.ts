import { type InferInput, boolean, object, optional } from 'valibot'

/**
 * Schema for updating user notification preferences.
 *
 * This schema validates notification preference updates, allowing users to:
 * - Toggle new contact email notifications
 * - Control monthly account summary emails
 * - Manage changelog newsletter subscriptions
 *
 * All fields are optional to support partial updates - users can update
 * individual preferences without affecting others. This follows the
 * single endpoint pattern used throughout the Kibamail codebase.
 */
export const UpdateUserPreferencesSchema = object({
  newContactNotifications: optional(
    boolean('New contact notifications must be true or false'),
  ),
  accountSummaryNotifications: optional(
    boolean('Account summary notifications must be true or false'),
  ),
  changelogNewsletters: optional(boolean('Changelog newsletters must be true or false')),
})

type UpdateUserPreferencesDto = InferInput<typeof UpdateUserPreferencesSchema>
