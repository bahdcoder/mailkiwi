import type {
  Team,
  TeamMembership,
} from "@/database/schema/database_schema_types.js"

export type TeamWithMembers = Team & {
  members: TeamMembership[]
}
