import { redirect } from "vike/abort"
import { PageContext } from "vike/types"

import { route } from "@/shared/routes/route_aliases.js"

export function guard(ctx: PageContext) {
  if (!ctx.user) {
    throw redirect(route("auth_login"))
  }
}
