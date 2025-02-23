import {
  type InferInput,
  array,
  boolean,
  date,
  number,
  object,
  optional,
  record,
  string,
  union,
} from 'valibot'

export const CreateContactSchema = object({
  email: string(),
  firstName: optional(string()),
  lastName: optional(string()),
  properties: optional(record(string(), union([string(), number(), boolean(), date()]))),
})

export type CreateContactDto = InferInput<typeof CreateContactSchema>
