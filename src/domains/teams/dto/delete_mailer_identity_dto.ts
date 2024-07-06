import { z } from "zod"

export const DeleteMailerIdentitySchema = z.object({
  deleteOnProvider: z.boolean().optional().default(false),
})

export type DeleteMailerIdentityDto = z.infer<typeof DeleteMailerIdentitySchema>
