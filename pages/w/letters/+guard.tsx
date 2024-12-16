import { redirect } from "vike/abort"
import { PageContext } from "vike/types"

import { route } from "@/shared/routes/route_aliases.js"

export function guard(ctx: PageContext) {
  if (ctx.urlPathname === route("letters")) {
    // todo: check if user has completed onboarding. if not, force redirect to letters onboarding.
    throw redirect(route("letters_welcome"))
  }
}
