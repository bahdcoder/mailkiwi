import { z } from "zod"

export const CreateTagSchema = z.object({
  name: z.string(),
})

export type CreateTagDto = z.infer<typeof CreateTagSchema>
