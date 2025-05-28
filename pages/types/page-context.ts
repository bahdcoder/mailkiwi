import type {
  Audience,
  SendingDomain,
  Tag,
  Team,
  TeamMembership,
  TeamWithMemberships,
  UserWithTeams,
} from '#root/database/database_schema_types.js'

export interface DefaultPageProps<T = object> {
  engage: {
    onboarded: boolean
  }
  send: {
    onboarded: boolean
  }
  sendingDomains: SendingDomain[]
  user: UserWithTeams
  team: TeamWithMemberships & {
    totalAvailableCredits: number
    totalConsumedCredits: number
  }
  pageProps: T
  userAgent: UAParser.IResult
  memberships: (TeamMembership & { team: Team })[]
  audience: Audience
  tags: Tag[]
  isMobile: boolean
  flash: string
}

export type DefaultPageContext = {
  pageProps: DefaultPageProps
}

declare global {
  namespace Vike {
    interface PageContext extends DefaultPageProps {}
  }
}
