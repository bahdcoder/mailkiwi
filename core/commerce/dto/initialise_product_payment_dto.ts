import { type InferInput, email, object, pipe, string } from 'valibot'

export const InitialiseProductPaymentSchema = object({
  email: pipe(string(), email()),
})

export type InitialiseProductPaymentDto = InferInput<
  typeof InitialiseProductPaymentSchema
>
