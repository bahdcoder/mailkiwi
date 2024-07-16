import { z } from "zod"

export const CreateAutomationSchema = z.object({
  name: z.string(),
})

export type CreateAutomationDto = z.infer<typeof CreateAutomationSchema>
