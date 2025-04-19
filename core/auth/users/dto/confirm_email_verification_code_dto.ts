import { type InferInput, objectAsync, pipe, regex, string } from 'valibot'

export const ConfirmEmailVerificationCodeSchema = objectAsync({
  code: pipe(string(), regex(/^\d{6}$/)),
})

export type ConfirmEmailVerificationCodeDto = InferInput<
  typeof ConfirmEmailVerificationCodeSchema
>
