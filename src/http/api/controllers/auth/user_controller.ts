import { container, inject, injectable } from "tsyringe"

import { UserRepository } from "@/domains/auth/users/repositories/user_repository.js"
import { GetMailerAction } from "@/domains/teams/actions/mailers/get_mailer_action.js"
import { ContainerKey } from "@/infrastructure/container.js"
import { HonoInstance } from "@/infrastructure/server/hono.ts"
import { HonoContext } from "@/infrastructure/server/types.ts"

@injectable()
export class UserController {
  constructor(
    @inject(UserRepository) private userRepository: UserRepository,
    @inject(ContainerKey.app) private app: HonoInstance,
  ) {
    this.app.defineRoutes([["GET", "/profile", this.profile.bind(this)]], {
      prefix: "auth",
    })
  }

  async profile(ctx: HonoContext) {
    const getMailerAction = container.resolve(GetMailerAction)

    // Sync mailer identity statuses from AWS.
    try {
      await getMailerAction.handle(ctx.get("team"))
    } catch (error) {
      d({ error })
      //
    }

    const user = await this.userRepository.findById(
      ctx.get("accessToken").userId,
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
