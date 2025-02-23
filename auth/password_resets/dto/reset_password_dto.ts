import { type InferInput, email, object, pipe, regex, string } from 'valibot'

const password = pipe(
  string(),
  regex(/[A-Z]/, 'Must contain capital letter.'),
  regex(/[a-z]/, 'Must contain lowercase letter.'),
  regex(/[0-9]/, 'Must contain a number.'),
)

export const ResetPasswordSchema = object({
  email: pipe(string(), email()),
  password,
  passwordConfirm: password,
})

export type ResetPasswordDto = InferInput<typeof ResetPasswordSchema>
