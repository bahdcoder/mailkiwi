import type { DrizzleClient } from "#root/database/client";
import type { users, teams, teamMemberships } from "#root/database/schema.js";

import {
  UserSessionMiddleware as FrameworkUserSessionMiddleware,
} from "@kibamail/framework";

export class UserSessionMiddleware extends FrameworkUserSessionMiddleware<
  typeof teams,
  typeof teamMemberships,
  typeof users,
  DrizzleClient
> {}
