import { type InferInput, maxLength, objectAsync, optional, pipe, string } from "valibot"

export const SetUserNameSchema = objectAsync({
  firstName: optional(pipe(string(), maxLength(50))),
  lastName: optional(pipe(string(), maxLength(50))),
})

export type SetUserNameDto = InferInput<typeof SetUserNameSchema>
