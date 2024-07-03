import { TeamRepository } from "@/domains/teams/repositories/team_repository"

export type TeamWithMembers = Awaited<ReturnType<TeamRepository["findById"]>>
