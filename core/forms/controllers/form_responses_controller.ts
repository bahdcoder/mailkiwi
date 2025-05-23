import { WEBSITES_PATH } from '#root/core/app/env/app_env.js'
import { TagContactBasedOnResponseJob } from '#root/core/forms/jobs/tag_contact_based_on_response_job.js'
import { FormRepository } from '#root/core/forms/repositories/form_repository.js'
import { FormResponseRepository } from '#root/core/forms/repositories/form_response_repository.js'
import { FormResponseValidatorTool } from '#root/core/forms/tools/form_response_validator_tool.js'
import { WebsiteRepository } from '#root/core/websites/repositories/website_repository.js'

import { AudienceRepository } from '#root/core/audiences/repositories/audience_repository.js'
import { ContactRepository } from '#root/core/audiences/repositories/contact_repository.js'

import { UserSessionMiddleware } from '#root/core/auth/middleware/user_session_middleware.js'

import type { Audience, Form } from '#root/database/database_schema_types.js'

import { makeApp } from '#root/core/shared/container/index.js'
import { BaseController } from '#root/core/shared/controllers/base_controller.js'
import { Queue } from '#root/core/shared/queue/queue.js'
import type { HonoContext } from '#root/core/shared/server/types.js'

import { container } from '#root/core/utils/typi.js'

export class FormResponsesController extends BaseController {
  constructor(
    protected app = makeApp(),
    protected contactRepository = container.make(ContactRepository),
  ) {
    super()

    this.app.defineRoutes([['POST', '/responses', this.submit.bind(this)]], {
      prefix: `${WEBSITES_PATH}/:websiteSlug/forms/:formId`,
      middleware: [container.make(UserSessionMiddleware).handle],
    })
  }

  async submit(ctx: HonoContext) {
    const [website, form] = await Promise.all([
      container.make(WebsiteRepository).findBySlug(ctx.req.param('websiteSlug')),
      container.make(FormRepository).forms().findById(ctx.req.param('formId')),
    ])

    const payload = await ctx.req.json()

    if (!website) {
      return ctx.notFound()
    }

    if (!form) {
      return ctx.notFound()
    }

    const audience = await container.make(AudienceRepository).findById(form.audienceId)

    const { valid, errors } = await new FormResponseValidatorTool(form, payload).handle()

    if (!valid) {
      return ctx.json({ errors }, 422)
    }

    switch (form.type) {
      case 'signup':
        await this.submitSignup(audience, payload)
        break
      case 'survey':
        await this.submitSurvey(form, payload, ctx.get('contact')?.id)
        break
      default:
        break
    }

    return ctx.json({ id: form.id })
  }

  private async submitSignup(audience: Audience, payload: Record<string, string>) {
    const { email, firstname: firstName, lastname: lastName, ...properties } = payload

    const contact = {
      email,
      firstName,
      lastName,
      properties,
    }

    const { id: contactId } = await this.contactRepository.create(contact, audience)

    return { contactId }
  }

  private async submitSurvey(
    form: Form,
    payload: Record<string, string[]>,
    contactId?: string,
  ) {
    const formResponse = await container.make(FormResponseRepository).responses().create({
      formId: form.id,
      response: payload,
      contactId,
    })

    await Queue.contacts().add(TagContactBasedOnResponseJob.id, {
      formResponseId: formResponse.id,
    })
  }
}
