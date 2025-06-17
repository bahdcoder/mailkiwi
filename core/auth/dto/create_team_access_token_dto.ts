import {
  enum_,
  type InferInput,
  maxLength,
  nonEmpty,
  object,
  pipe,
  string,
} from 'valibot'

export enum ApiKeyCapability {
  Full = 'full',
  Send = 'send',
  Engage = 'engage',
}

export const CreateTeamAccessTokenSchema = object({
  name: pipe(
    string('Team name must be a text value'),
    nonEmpty('Please provide a name for your workspace'),
    maxLength(32, 'Name must be less than 32 characters'),
  ),
  capabilities: enum_(ApiKeyCapability, 'Please select a valid capability'),
})

export type CreateTeamAccessTokenDto = InferInput<typeof CreateTeamAccessTokenSchema>
