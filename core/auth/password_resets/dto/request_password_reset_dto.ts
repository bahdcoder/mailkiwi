import { type InferInput, email, object, pipe, string } from 'valibot'

export const RequestPasswordResetSchema = object({
  email: pipe(string(), email()),
})

export type RequestPasswordResetDto = InferInput<typeof RequestPasswordResetSchema>
