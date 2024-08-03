import { type InferInput, object, string } from 'valibot'

export const LoginUserSchema = object({
  email: string(),
  password: string(),
})

export type LoginUserDto = InferInput<typeof LoginUserSchema>
