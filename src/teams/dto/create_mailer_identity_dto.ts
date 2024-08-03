import {
  type InferInput,
  check,
  email,
  object,
  picklist,
  pipe,
  regex,
  safeParse,
  string,
} from 'valibot'

export const CreateMailerIdentitySchema = pipe(
  object({
    value: string(),
    type: picklist(['EMAIL', 'DOMAIN'] as const),
  }),
  check((input) => {
    if (input.type === 'EMAIL') {
      return safeParse(pipe(string(), email()), input.value).success
    }

    if (input.type === 'DOMAIN') {
      return safeParse(
        pipe(
          string(),
          regex(/^(?!:\/\/)([a-zA-Z0-9-_]+(\.[a-zA-Z0-9-_]+)+.*)$/),
        ),
        input.value,
      ).success
    }

    return false
  }, 'Value must be a valid email or domain.'),
)

export type CreateMailerIdentityDto = InferInput<
  typeof CreateMailerIdentitySchema
>
