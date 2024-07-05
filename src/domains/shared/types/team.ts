import { Mailer, MailerIdentity, Team, TeamMembership } from "@prisma/client"

export type TeamWithMembers = Team & {
  members: TeamMembership[]
  mailer: Mailer & { identities: MailerIdentity[] }
}
