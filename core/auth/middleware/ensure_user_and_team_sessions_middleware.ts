import { E_OPERATION_FAILED, E_UNAUTHORIZED } from '@/http/responses/errors.js'

export class EnsureUserAndTeamSessionsMiddleware {
  handle = async (ctx: { get: (key: string) => unknown }, next: () => Promise<void>) => {
    const user = ctx.get('user')

    if (!user) throw E_UNAUTHORIZED()

    const team = ctx.get('team')

    if (!team) throw E_OPERATION_FAILED('Invalid team selector provided.')

    await next()
  }
}
