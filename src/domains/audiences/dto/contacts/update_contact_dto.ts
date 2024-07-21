import {
  objectAsync,
  string,
  optional,
  union,
  array,
  number,
  record,
  pipe,
  url,
  InferInput,
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
