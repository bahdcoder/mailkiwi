import { ConfirmEmailVerificationCodeSchema } from "../users/dto/confirm_email_verification_code_dto.js"
import { SetUserNameSchema } from "../users/dto/set_user_name_dto.js"
import { SetUserPasswordSchema } from "../users/dto/set_user_password_dto.js"
import { appEnv } from "@/app/env/app_env.js"
import { Next } from "hono"

import { AudienceRepository } from "@/audiences/repositories/audience_repository.js"

import { TeamRepository } from "@/teams/repositories/team_repository.js"

import { RegisterUserAction } from "@/auth/actions/register_user_action.js"
import { CreateUserSchema } from "@/auth/users/dto/create_user_dto.js"
import { UserRepository } from "@/auth/users/repositories/user_repository.js"

import { E_VALIDATION_FAILED } from "@/http/responses/errors.js"

import { makeApp, makeDatabase } from "@/shared/container/index.js"
import { VikeController } from "@/shared/controllers/vike_controller.js"
import { middleware } from "@/shared/middleware/middleware_aliases.js"
import { route } from "@/shared/routes/route_aliases.js"
import type { HonoContext } from "@/shared/server/types.js"
import { Session } from "@/shared/sessions/sessions.js"

import { container } from "@/utils/typi.js"

export class RegisterController extends VikeController {
  constructor(
    private userRepository = container.make(UserRepository),
    private app = makeApp(),
  ) {
    super()

    this.app.defineRoutes(
      [
        ...this.vikePath(
          route("auth_register"),
          this.redirectToWelcomeIfAuthenticatedPage,
        ),
        ["POST", route("auth_register"), this.register.bind(this)],
      ],
      {
        prefix: "",
        middleware: [],
      },
    )

    this.app.defineRoutes(
      [
        ...this.vikePath(route("auth_register_password"), this.passwordPage),
        ...this.vikePath(route("auth_register_email_confirm"), this.page),
        ["POST", route("auth_register_password"), this.password.bind(this)],
        ["POST", route("auth_register_profile"), this.profile.bind(this)],
        ["POST", route("auth_register_email_confirm"), this.emailConfirm.bind(this)],
      ],
      {
        prefix: "",
        middleware: [middleware("must_be_authenticated")],
      },
    )
  }

  async register(ctx: HonoContext) {
    const { user, plainEmailVerificationCode } = await container
      .resolve(RegisterUserAction)
      .handle(await this.validate(ctx, CreateUserSchema))

    if (appEnv.isDev) {
      d({ plainEmailVerificationCode })
    }

    await this.session.createForUser(ctx, {
      userId: user.id,
    })

    return this.response(ctx).redirect(route("auth_register_email_confirm")).send()
  }

  async profile(ctx: HonoContext) {
    const user = ctx.get("user")

    const payload = await this.validate(ctx, SetUserNameSchema)

    await makeDatabase().transaction(async (trx) => {
      const [, team] = await Promise.all([
        this.userRepository.transaction(trx).update(user.id, payload),
        container
          .make(TeamRepository)
          .transaction(trx)
          .createFirstTeam({ name: payload.teamName }, user.id),
      ])

      await Promise.all([
        container.make(AudienceRepository).audiences().create({
          name: payload.teamName,
          teamId: team.id,
        }),
        new Session().updateCurrentSessionTeamId(ctx, team.id),
      ])

      return { team }
    })

    return this.response(ctx).redirect(route("welcome")).send()
  }

  async emailConfirm(ctx: HonoContext) {
    const user = ctx.get("user")

    if (user.emailVerifiedAt) {
      return this.response(ctx).redirect(route("welcome")).send()
    }

    const payload = await this.validate(ctx, ConfirmEmailVerificationCodeSchema)

    const passed = await this.userRepository.confirmEmailVerificationCode(
      user,
      payload.code,
    )

    if (!passed) {
      throw E_VALIDATION_FAILED([
        {
          message:
            "The verification code you provided was incorrect. Please check your email and try again.",
          field: "code",
        },
      ])
    }

    return this.response(ctx).redirect(route("auth_register_password")).send()
  }

  passwordPage = async (ctx: HonoContext, next: Next) => {
    const user = ctx.get("user")

    if (user.password) {
      return this.response(ctx).redirect(route("auth_register_profile")).send()
    }

    return this.page(ctx, next)
  }

  async password(ctx: HonoContext) {
    const user = ctx.get("user")

    if (user.password) {
      throw E_VALIDATION_FAILED([
        {
          message: "You have already set a password. Please login instead.",
          field: "password",
        },
      ])
    }

    const payload = await this.validate(ctx, SetUserPasswordSchema)

    await this.userRepository.update(user.id, payload)

    return this.response(ctx).redirect(route("auth_register_profile")).send()
  }
}
