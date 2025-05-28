import { type InferInput, nonEmpty, object, pipe, string } from 'valibot'

export const CreateTeamDto = object({
  name: pipe(
    string('Team name must be a text value'),
    nonEmpty('Please provide a name for your workspace'),
  ),
})

export type CreateTeamDto = InferInput<typeof CreateTeamDto>
