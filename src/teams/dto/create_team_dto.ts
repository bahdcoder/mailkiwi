import { type InferInput, object, string } from 'valibot'

export const CreateTeamDto = object({
  name: string(),
})

export type CreateTeamDto = InferInput<typeof CreateTeamDto>
