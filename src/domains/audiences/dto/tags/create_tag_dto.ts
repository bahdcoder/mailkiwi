import * as v from "valibot"

export const CreateTagSchema = v.object({
  name: v.string(),
})

export type CreateTagDto = v.InferInput<typeof CreateTagSchema>
