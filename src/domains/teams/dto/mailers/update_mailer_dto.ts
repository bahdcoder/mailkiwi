import { Secret } from '@poppinss/utils'
import {
  type BaseSchema,
  type InferInput,
  check,
  email,
  number,
  object,
  optional,
  picklist,
  pipe,
  regex,
  string,
  transform,
} from 'valibot'

const regions = [
  'us-east-2',
  'us-east-1',
  'us-west-1',
  'us-west-2',
  'af-south-1',
  'ap-south-1',
  'ap-northeast-3',
  'ap-northeast-2',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-northeast-1',
  'ca-central-1',
  'cn-northwest-1',
  'eu-central-1',
  'eu-west-1',
  'eu-west-2',
  'eu-south-1',
  'eu-west-3',
  'eu-north-1',
  'me-south-1',
  'sa-east-1',
  'us-gov-west-1',
] as const

export type ConfigurationObjectInput = {
  accessKey: Secret<string>
  accessSecret: Secret<string>
  region: (typeof regions)[number]
  domain: string | undefined
  email: string | undefined
}

export type BaseSchemaConfiguration = BaseSchema<
  {
    configuration: ConfigurationObjectInput
  },
  any,
  any
>

export const ConfigurationSchema = object({
  accessKey: optional(
    pipe(
      string(),
      transform((input) => new Secret(input ?? '')),
    ),
  ),
  accessSecret: optional(
    pipe(
      string(),
      transform((input) => new Secret(input ?? '')),
    ),
  ),
  region: optional(
    picklist([
      'us-east-2',
      'us-east-1',
      'us-west-1',
      'us-west-2',
      'af-south-1',
      'ap-south-1',
      'ap-northeast-3',
      'ap-northeast-2',
      'ap-southeast-1',
      'ap-southeast-2',
      'ap-northeast-1',
      'ca-central-1',
      'cn-northwest-1',
      'eu-central-1',
      'eu-west-1',
      'eu-west-2',
      'eu-south-1',
      'eu-west-3',
      'eu-north-1',
      'me-south-1',
      'sa-east-1',
      'us-gov-west-1',
    ]),
  ),
  domain: optional(
    pipe(string(), regex(/^(?!:\/\/)([a-zA-Z0-9-_]{1,63}\.)+[a-zA-Z]{2,6}$/)),
  ),
  email: optional(pipe(string(), email())),
})
export const UpdateMailerSchema = pipe(
  object({
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
    configuration: {
      accessKey: Secret<string>
      accessSecret: Secret<string>
      region: (typeof regions)[number]
      domain: string | undefined
      email: string | undefined
    }
  },
  any,
  any
>

export type UpdateMailerDto = InferInput<typeof UpdateMailerSchema>
