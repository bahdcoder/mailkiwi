import { redirect } from "vike/abort"
import { PageContext } from "vike/types"

import { route } from "@/shared/routes/route_aliases.js"

export function guard(ctx: PageContext) {
  console.log({ ctx: ctx.letters })
  if (ctx.urlPathname === route("letters")) {
    if (!ctx.letters.audience) {
      throw redirect(route("letters_welcome"))
    }
  }
}
