import { object, string, InferInput } from "valibot"

export const CreateAudienceSchema = object({
  name: string(),
})

export type CreateAudienceDto = InferInput<typeof CreateAudienceSchema>
