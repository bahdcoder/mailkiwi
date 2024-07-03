import { z } from "zod"

export const CreateTeamDto = z.object({
  name: z.string(),
})

export type CreateTeamDto = z.infer<typeof CreateTeamDto>
