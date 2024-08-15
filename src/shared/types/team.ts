import type {
  Mailer,
  MailerIdentity,
  Team,
  TeamMembership,
} from '@/database/schema/types.js'

export type TeamWithMembers = Team & {
  members: TeamMembership[]
  mailer: Mailer & { identities: MailerIdentity[] }
}
