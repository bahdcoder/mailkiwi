import { z } from "zod"
import { container } from "tsyringe"
import { TeamRepository } from "@/domains/teams/repositories/team_repository"

export const CreateTeamDto = z.object({
  name: z.string(),
})

export type CreateTeamDto = z.infer<typeof CreateTeamDto>
