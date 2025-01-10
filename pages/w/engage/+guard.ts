import { redirect } from "vike/abort"
import { PageContext } from "vike/types"

import { route } from "@/shared/routes/route_aliases.js"

export function guard(ctx: PageContext) {
  if (ctx.urlPathname === route("engage")) {
    if (!ctx.audience) {
      throw redirect(route("engage_welcome"))
    }
  }
}
