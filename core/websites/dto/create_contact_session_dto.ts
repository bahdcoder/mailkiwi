import { type InferInput, email, object, pipe, string } from 'valibot'

export const CreateContactSessionSchema = object({
  email: pipe(string(), email()),
})

type CreateContactSessionDto = InferInput<typeof CreateContactSessionSchema>
