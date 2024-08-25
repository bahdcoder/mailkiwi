import {
  type InferInput,
  array,
  number,
  object,
  optional,
  record,
  string,
  union,
} from "valibot"

export const CreateContactSchema = object({
  email: string(),
  firstName: optional(string()),
  lastName: optional(string()),
  attributes: optional(
    record(
      string(),
      union([string(), array(string()), number(), array(number())]),
    ),
  ),
})

export type CreateContactDto = InferInput<typeof CreateContactSchema>
