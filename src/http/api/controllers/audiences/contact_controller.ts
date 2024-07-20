import { CreateContactAction } from "@/domains/audiences/actions/contacts/create_contact_action.js"
import { CreateContactSchema } from "@/domains/audiences/dto/contacts/create_contact_dto.js"
import { AudiencePolicy } from "@/domains/audiences/policies/audience_policy.js"
import { BaseController } from "@/domains/shared/controllers/base_controller.js"
import { E_UNAUTHORIZED } from "@/http/responses/errors.js"
import { makeApp } from "@/infrastructure/container.js"
import { HonoInstance } from "@/infrastructure/server/hono.js"
import { HonoContext } from "@/infrastructure/server/types.js"
import { container } from "@/utils/typi.js"

export class ContactController extends BaseController {
  constructor(private app: HonoInstance = makeApp()) {
    super()

    this.app.defineRoutes([["POST", "/", this.store.bind(this)]], {
      prefix: "contacts",
    })
  }

  async index(ctx: HonoContext) {
    return ctx.json([])
  }

  async store(ctx: HonoContext) {
    const data = await this.validate(ctx, CreateContactSchema)

    const team = this.ensureTeam(ctx)

    const policy = container.resolve(AudiencePolicy)

    if (!policy.canCreate(team, ctx.get("accessToken").userId!))
      throw E_UNAUTHORIZED()

    const action = container.resolve(CreateContactAction)

    const audience = await action.handle(data)

    return ctx.json(audience)
  }
}
