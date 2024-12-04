import { type InferInput, maxValue, minValue, number, objectAsync, pipe } from "valibot"

export const ConfirmEmailVerificationCodeSchema = objectAsync({
  code: pipe(number(), minValue(100000), maxValue(999999)),
})

export type ConfirmEmailVerificationCodeDto = InferInput<
  typeof ConfirmEmailVerificationCodeSchema
>
