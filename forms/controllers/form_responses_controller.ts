import { WEBSITES_PATH } from "@/app/env/app_env.js"
import { FormRepository } from "@/forms/repositories/form_repository.js"
import { FormResponseRepository } from "@/forms/repositories/form_response_repository.js"
import { FormResponseValidatorTool } from "@/forms/tools/form_response_validator_tool.js"
import { WebsiteRepository } from "@/websites/repositories/website_repository.js"

import { UserSessionMiddleware } from "@/auth/middleware/user_session_middleware.js"

import { E_VALIDATION_FAILED } from "@/http/responses/errors.js"

import { makeApp } from "@/shared/container/index.js"
import { BaseController } from "@/shared/controllers/base_controller.js"
import { HonoContext } from "@/shared/server/types.js"

import { container } from "@/utils/typi.js"

export class FormResponsesController extends BaseController {
  constructor(protected app = makeApp()) {
    super()

    this.app.defineRoutes(
      [["POST", "/responses", this.submit.bind(this)]],
      {
        prefix: `${WEBSITES_PATH}/:websiteSlug/forms/:formId`,
        middleware: [container.make(UserSessionMiddleware).handle],
      },
    )
  }

  async submit(ctx: HonoContext) {
    const [website, form] = await Promise.all([
      container
        .make(WebsiteRepository)
        .findBySlug(ctx.req.param("websiteSlug")),
      container
        .make(FormRepository)
        .forms()
        .findById(ctx.req.param("formId")),
    ])

    const payload = await ctx.req.json()

    if (!website) {
      return ctx.notFound()
    }

    if (!form) {
      return ctx.notFound()
    }

    const { valid, errors } = await new FormResponseValidatorTool(
      form,
      payload,
    ).handle()

    if (!valid) {
      return ctx.json({ errors }, 422)
    }

    await container
      .make(FormResponseRepository)
      .responses()
      .create({
        formId: form.id,
        response: payload,
        contactId: ctx.get("contact")?.id,
      })

    return ctx.json({ id: form.id })
  }
}
