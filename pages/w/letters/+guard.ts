import { redirect } from "vike/abort"
import { PageContext } from "vike/types"

import { route } from "@/shared/routes/route_aliases.js"

export function guard(ctx: PageContext) {
  if (ctx.urlPathname === route("letters")) {
    if (!ctx.letters.audience) {
      throw redirect(route("letters_welcome"))
    }
  }
}
