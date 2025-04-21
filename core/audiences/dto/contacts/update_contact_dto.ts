import {
  url,
  type InferInput,
  array,
  boolean,
  date,
  number,
  objectAsync,
  optional,
  pipe,
  record,
  string,
  union,
} from 'valibot'

export const UpdateContactDto = objectAsync({
  firstName: optional(string()),
  lastName: optional(string()),
  avatarUrl: optional(pipe(string(), url())),
  properties: optional(record(string(), union([string(), number(), date(), boolean()]))),
})

export type UpdateContactDto = InferInput<typeof UpdateContactDto>
