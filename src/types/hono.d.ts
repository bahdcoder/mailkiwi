import {} from "hono";

import type { TeamWithMembers } from "@/shared/types/team";
import type { AccessToken, User } from "@/database/schema/types.js";

declare module "hono" {
  interface ContextVariableMap {
    accessToken: AccessToken;
    team: TeamWithMembers;
    user: User;
  }

  interface Context {
    accessToken: AccessToken;
    team: TeamWithMembers;
    user: User;
  }
}
