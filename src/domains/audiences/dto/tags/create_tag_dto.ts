import { string, nonEmpty, pipe, object, InferInput } from "valibot"

export const CreateTagSchema = object({
  name: pipe(string(), nonEmpty()),
})

export type CreateTagDto = InferInput<typeof CreateTagSchema>
