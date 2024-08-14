import { UserRepository } from "@/auth/users/repositories/user_repository.js";
import { GetMailerAction } from "@/teams/actions/mailers/get_mailer_action.js";
import { makeApp } from "@/shared/container/index.js";
import type { HonoContext } from "@/server/types.js";
import { container } from "@/utils/typi.js";

export class UserController {
  constructor(
    private userRepository = container.make(UserRepository),
    private app = makeApp(),
  ) {
    this.app.defineRoutes([["GET", "/profile", this.profile.bind(this)]], {
      prefix: "auth",
    });
  }

  async profile(ctx: HonoContext) {
    const getMailerAction = container.resolve(GetMailerAction);

    // Sync mailer identity statuses from AWS.
    try {
      await getMailerAction.handle(ctx.get("team"));
    } catch (error) {
      d({ error });
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
    );

    return ctx.json(user);
  }
}
