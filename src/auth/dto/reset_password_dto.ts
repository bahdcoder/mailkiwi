import * as v from 'valibot'

export const ResetPasswordSchema = v.object({
  // Define schema properties here
})

export type ResetPasswordDto = v.InferInput<typeof ResetPasswordSchema>
