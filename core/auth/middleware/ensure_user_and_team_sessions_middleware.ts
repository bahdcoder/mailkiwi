import { E_OPERATION_FAILED, E_UNAUTHORIZED } from '#root/core/http/responses/errors.js'
import type { HonoContext } from '#root/core/shared/server/types.js'

export class EnsureUserAndTeamSessionsMiddleware {
  handle = async (ctx: HonoContext, next: () => Promise<void>) => {
    const user = ctx.get('user')

    if (!user) throw E_UNAUTHORIZED()

    const team = ctx.get('team')

    if (!team) {
      throw E_OPERATION_FAILED('Invalid team selector provided.')
    }

    await next()
  }
}
