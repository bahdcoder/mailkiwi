import { type InferInput, nonEmpty, objectAsync, optional, pipe, string } from 'valibot'

/**
 * Schema for creating a new broadcast group.
 *
 * Broadcast groups help organize related campaigns together,
 * such as newsletters, promotional emails, or onboarding sequences.
 */
export const CreateBroadcastGroupSchema = objectAsync({
  name: pipe(
    string('Group name must be a text value'),
    nonEmpty(
      'Please provide a name for this broadcast group to help organize your campaigns',
    ),
  ),
})

export type CreateBroadcastGroupDto = InferInput<typeof CreateBroadcastGroupSchema>
