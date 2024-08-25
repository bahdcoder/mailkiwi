import {
  type InferInput,
  array,
  number,
  objectAsync,
  optional,
  pipe,
  record,
  string,
  union,
  url,
} from "valibot"

export const UpdateContactDto = objectAsync({
  firstName: optional(string()),
  lastName: optional(string()),
  avatarUrl: optional(pipe(string(), url())),
  attributes: optional(
    record(
      string(),
      union([string(), array(string()), number(), array(number())]),
    ),
  ),
})

export type UpdateContactDto = InferInput<typeof UpdateContactDto>
