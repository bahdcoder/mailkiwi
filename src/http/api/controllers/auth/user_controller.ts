import { UserRepository } from '@/domains/auth/users/repositories/user_repository.js'
import { GetMailerAction } from '@/domains/teams/actions/mailers/get_mailer_action.js'
import { makeApp } from '@/infrastructure/container.js'
import type { HonoInstance } from '@/infrastructure/server/hono.js'
import type { HonoContext } from '@/infrastructure/server/types.js'
import { container } from '@/utils/typi.js'

export class UserController {
  constructor(
    private userRepository: UserRepository = container.make(UserRepository),
    private app: HonoInstance = makeApp(),
  ) {
    this.app.defineRoutes([['GET', '/profile', this.profile.bind(this)]], {
      prefix: 'auth',
    })
  }

  async profile(ctx: HonoContext) {
    const getMailerAction = container.resolve(GetMailerAction)

    // Sync mailer identity statuses from AWS.
    try {
      await getMailerAction.handle(ctx.get('team'))
    } catch (error) {
      d({ error })
      //
    }

    const user = await this.userRepository.findById(
      ctx.get('accessToken').userId,
      {
        with: {
          teams: {
            with: {
              mailer: {
                with: {
                  identities: true,
                },
              },
              members: true,
            },
          },
        },
      },
    )

    return ctx.json(user)
  }
}
