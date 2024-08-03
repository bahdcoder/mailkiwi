import { type InferInput, object, string } from 'valibot'

export const CreateAudienceSchema = object({
  name: string(),
})

export type CreateAudienceDto = InferInput<typeof CreateAudienceSchema>
