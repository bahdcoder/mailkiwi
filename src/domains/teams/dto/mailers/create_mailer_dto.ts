import {
  type BaseSchema,
  check,
  type InferInput,
  object,
  picklist,
  pipe,
  string,
} from 'valibot'
import {
  type ConfigurationObjectInput,
  ConfigurationSchema,
} from './update_mailer_dto.ts'

export const CreateMailerSchema = pipe(
  object({
    name: string(),
    provider: picklist(['AWS_SES'] as const),
    configuration: ConfigurationSchema,
  }),
  check(
    (input) =>
      input.configuration?.domain !== undefined ||
      input.configuration.email !== undefined,
    'Either domain or email must be provided to enable sending emails.',
  ),
) as BaseSchema<
  {
    configuration: ConfigurationObjectInput
    name: string
    provider: 'AWS_SES'
  },
  any,
  any
>

export type CreateMailerDto = InferInput<typeof CreateMailerSchema>
