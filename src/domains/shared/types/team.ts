import {
  Mailer,
  MailerIdentity,
  Team,
  TeamMembership,
} from "@/infrastructure/database/schema/types.ts"

export type TeamWithMembers = Team & {
  members: TeamMembership[]
  mailer: Mailer & { identities: MailerIdentity[] }
}
