import { type InferInput, nonEmpty, object, pipe, string } from 'valibot'

export const CreateTagSchema = object({
  name: pipe(string(), nonEmpty()),
})

export type CreateTagDto = InferInput<typeof CreateTagSchema>
