import { type InferInput, email, object, pipe, string } from 'valibot'

export const InitialiseProductPaymentSchema = object({
  email: pipe(string(), email()),
})

type InitialiseProductPaymentDto = InferInput<typeof InitialiseProductPaymentSchema>
