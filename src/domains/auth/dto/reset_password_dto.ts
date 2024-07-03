import { z } from "zod"

export const ResetPasswordSchema = z.object({
  // Define schema properties here
})

export type ResetPasswordDto = z.infer<typeof ResetPasswordSchema>
