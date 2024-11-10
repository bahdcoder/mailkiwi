import { type InferInput, email, object, pipe, string } from "valibot"

export const LoginUserSchema = object({
  email: pipe(string(), email()),
  password: string(),
})

export type LoginUserDto = InferInput<typeof LoginUserSchema>
