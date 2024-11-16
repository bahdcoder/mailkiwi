import { CreateFormSchema } from "@/forms/dto/create_form_dto.js"
import { UpdateFormSchema } from "@/forms/dto/update_form_dto.js"
import { FormRepository } from "@/forms/repositories/form_repository.js"

import { UserSessionMiddleware } from "@/auth/middleware/user_session_middleware.js"

import { E_VALIDATION_FAILED } from "@/http/responses/errors.js"

import { makeApp } from "@/shared/container/index.js"
import { BaseController } from "@/shared/controllers/base_controller.js"
import { HonoContext } from "@/shared/server/types.js"
import { cuid } from "@/shared/utils/cuid/cuid.js"

import { container } from "@/utils/typi.js"

export class FormController extends BaseController {
  constructor(
    protected app = makeApp(),
    protected formRepository = container.make(FormRepository),
  ) {
    super()

    this.app.defineRoutes(
      [
        ["POST", "/", this.create.bind(this)],
        ["GET", "/", this.index.bind(this)],
        ["PUT", "/:formId", this.update.bind(this)],
        ["DELETE", "/:formId", this.delete.bind(this)],
      ],
      {
        prefix: "forms",
      },
    )
  }

  async create(ctx: HonoContext) {
    const payload = await this.validate(ctx, CreateFormSchema)
    const team = this.ensureCanManage(ctx)

    const form = await this.formRepository.forms().create({
      teamId: team.id,
      ...payload,
      fields: payload.fields?.map((field) => ({ ...field, id: cuid() })),
    })

    return ctx.json(form)
  }

  async ensureFormExists(ctx: HonoContext) {
    const form = await this.formRepository
      .forms()
      .findById(ctx.req.param("formId"))

    if (!form) {
      throw E_VALIDATION_FAILED([
        {
          message: "Form not found.",
          field: "formId",
        },
      ])
    }

    return form
  }

  async update(ctx: HonoContext) {
    this.ensureCanManage(ctx)
    const payload = await this.validate(ctx, UpdateFormSchema)

    const form = await this.ensureFormExists(ctx)

    this.ensureBelongsToTeam(ctx, form)

    await this.formRepository.update(form, payload)

    return ctx.json({ id: form.id })
  }

  async delete(ctx: HonoContext) {
    this.ensureCanManage(ctx)
    const form = await this.ensureFormExists(ctx)

    this.ensureBelongsToTeam(ctx, form)

    await this.formRepository.delete(form)

    return ctx.json({ id: form.id })
  }

  async index(ctx: HonoContext) {
    this.ensureCanView(ctx)
  }

  async get(ctx: HonoContext) {}
}
