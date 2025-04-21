import {
  type InferInput,
  ipv4,
  ipv6,
  object,
  optional,
  picklist,
  pipe,
  regex,
  string,
} from 'valibot'

export const CreateSendingSourceSchema = object({
  address: pipe(string(), ipv4()),
  ehloDomain: pipe(
    string(),
    regex(
      new RegExp(
        /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i,
      ),
    ),
  ),
  addressIpv6: optional(pipe(string(), ipv6())),
  pool: picklist(['engage', 'send']),
})

export type CreateSendingSourceDto = InferInput<typeof CreateSendingSourceSchema>
