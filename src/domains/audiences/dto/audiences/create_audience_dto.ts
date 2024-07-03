import { z } from "zod"

export const CreateAudienceSchema = z.object({
  name: z.string(),
})

export type CreateAudienceDto = z.infer<typeof CreateAudienceSchema>
