import { type UAParser } from "ua-parser-js"

import {
  type TeamWithMemberships,
  type UserWithTeams,
} from "@/database/database_schema_types.js"

export interface DefaultPageProps {
  user: UserWithTeams
  team: TeamWithMemberships
}

declare global {
  namespace Vike {
    interface PageContext {
      user: DefaultPageProps["user"]
      team: DefaultPageProps["team"]
      userAgent: UAParser.IResult
    }
  }
}
