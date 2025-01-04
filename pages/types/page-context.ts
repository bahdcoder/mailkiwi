import { type UAParser } from "ua-parser-js"

import type {
  Audience,
  Tag,
  Team,
  TeamMembership,
  TeamWithMemberships,
  UserWithTeams,
} from "@/database/database_schema_types.js"

export interface DefaultPageProps {
  user: UserWithTeams
  team: TeamWithMemberships
  userAgent: UAParser.IResult
  memberships: (TeamMembership & { team: Team })[]
  letters: {
    audience: Audience
  }
  audience: Audience
  tags: Tag[]
  pageProps: Record<string, any>
}

declare global {
  namespace Vike {
    interface PageContext {
      user: DefaultPageProps["user"]
      team: DefaultPageProps["team"]
      userAgent: DefaultPageProps["userAgent"]
      isMobile: boolean
      flash: string
      memberships: DefaultPageProps["memberships"]
      letters: DefaultPageProps["letters"]
      tags: DefaultPageProps["tags"]
      pageProps: DefaultPageProps["pageProps"]
    }
  }
}
