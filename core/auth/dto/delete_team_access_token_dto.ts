import { type InferInput, nonEmpty, object, pipe, uuid, string } from 'valibot'

export const DeleteTeamAccessTokenSchema = object({
  id: pipe(
    string('API key not found.'),
    uuid('API key not found.'),
    nonEmpty('API key not found.'),
  ),
})
