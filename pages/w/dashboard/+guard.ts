import { PageContext } from "vike/types"

export function guard(ctx: PageContext) {
  if (ctx.user) {
    // todo: check if onboarding completed
  }
}
