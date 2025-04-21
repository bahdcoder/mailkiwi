import {
  type InferInput,
  array,
  minLength,
  object,
  pipe,
  record,
  string,
  uuid,
} from 'valibot'

export const SubmitFormDto = object({
  responses: record(pipe(string(), uuid()), pipe(array(string()), minLength(1))),
})

export type SubmitFormDto = InferInput<typeof SubmitFormDto>
