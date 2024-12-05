import { type InferInput, email, object, pipe, string } from "valibot"

export const CreateUserSchema = object({
  email: pipe(string(), email()),
})

export type CreateUserDto = InferInput<typeof CreateUserSchema>
