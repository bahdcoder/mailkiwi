import type { UAParser } from 'ua-parser-js'

import type {
  Audience,
  SendingDomain,
  Tag,
  Team,
  TeamMembership,
  TeamWithMemberships,
  UserWithTeams,
} from '@/database/database_schema_types.js'

export interface DefaultPageProps {
  user: UserWithTeams
  team: TeamWithMemberships & {
    totalAvailableCredits: number
    totalConsumedCredits: number
  }
  userAgent: UAParser.IResult
  memberships: (TeamMembership & { team: Team })[]
  audience: Audience
  tags: Tag[]
  pageProps: Record<string, unknown>
  engage: {
    onboarded: boolean
  }
  send: {
    onboarded: boolean
  }
  sendingDomains: SendingDomain[]
}

declare global {
  namespace Vike {
    interface PageContext {
      user: DefaultPageProps['user']
      team: DefaultPageProps['team']
      userAgent: DefaultPageProps['userAgent']
      isMobile: boolean
      flash: string
      memberships: DefaultPageProps['memberships']
      audience: DefaultPageProps['audience']
      tags: DefaultPageProps['tags']
      pageProps: DefaultPageProps['pageProps']
      engage: DefaultPageProps['engage']
      send: DefaultPageProps['send']
      sendingDomains: DefaultPageProps['sendingDomains']
    }
  }
}
