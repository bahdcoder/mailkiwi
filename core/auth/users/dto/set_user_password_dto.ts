import { type InferInput, objectAsync, pipe, regex, string } from 'valibot'

export const SetUserPasswordSchema = objectAsync({
  password: pipe(
    string(),
    regex(/[A-Z]/, 'Must contain capital letter.'),
    regex(/[a-z]/, 'Must contain lowercase letter.'),
    regex(/[0-9]/, 'Must contain a number.'),
  ),
})

export type SetUserPasswordDto = InferInput<typeof SetUserPasswordSchema>
