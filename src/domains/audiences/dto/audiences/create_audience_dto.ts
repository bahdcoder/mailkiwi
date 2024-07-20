import * as v from "valibot"

export const CreateAudienceSchema = v.object({
  name: v.string(),
})

export type CreateAudienceDto = v.InferInput<typeof CreateAudienceSchema>
