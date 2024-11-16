import { CreateFormSchema } from "@/forms/dto/create_form_dto.js"
import { FormRepository } from "@/forms/repositories/form_repository.js"

import { makeApp } from "@/shared/container/index.js"
import { BaseController } from "@/shared/controllers/base_controller.js"
import { HonoContext } from "@/shared/server/types.js"

import { container } from "@/utils/typi.js"

export class FormController extends BaseController {
  constructor(protected app = makeApp()) {
    super()

    this.app.defineRoutes(
      [
        ["POST", "/", this.create.bind(this)],
        ["GET", "/", this.index.bind(this)],
      ],
      {
        prefix: "forms",
      },
    )

    this.app.defineRoutes(
      [["POST", "/responses", this.submit.bind(this)]],
      { prefix: "forms/:formId" },
    )

    this.app.defineRoutes(
      [["POST", "/responses", this.submit.bind(this)]],
      { prefix: "forms/:formId", middleware: [] },
    )
  }

  async create(ctx: HonoContext) {
    const payload = await this.validate(ctx, CreateFormSchema)
    const team = this.ensureCanManage(ctx)

    const form = await container
      .make(FormRepository)
      .forms()
      .create({
        teamId: team.id,
        ...payload,
      })

    return ctx.json(form)
  }

  async submit(ctx: HonoContext) {}

  async index(ctx: HonoContext) {
    this.ensureCanView(ctx)
  }

  async get(ctx: HonoContext) {}
}
