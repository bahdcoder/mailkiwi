import { type InferInput, email, object, pipe, string } from "valibot"

export const CreateUserSchema = object({
  email: pipe(string(), email("Please provide a valid email address.")),
})

export type CreateUserDto = InferInput<typeof CreateUserSchema>
