import { z } from "zod"

export const CreateContactSchema = z.object({
  email: z.string().email(),
  audienceId: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
})

export type CreateContactDto = z.infer<typeof CreateContactSchema>
