import { CreateFormSchema } from '#root/core/forms/dto/create_form_dto.js'
import { UpdateFormSchema } from '#root/core/forms/dto/update_form_dto.js'
import { FormRepository } from '#root/core/forms/repositories/form_repository.js'

import type { Audience } from '#root/database/database_schema_types.js'

import { E_VALIDATION_FAILED } from '#root/core/http/responses/errors.js'

import { makeApp } from '#root/core/shared/container/index.js'
import { BaseController } from '#root/core/shared/controllers/base_controller.js'
import type { HonoContext } from '#root/core/shared/server/types.js'
import { cuid } from '#root/core/shared/utils/cuid/cuid.js'

import { container } from '#root/core/utils/typi.js'

/**
 * FormController manages subscription and lead capture forms.
 *
 * This controller is responsible for:
 * 1. Creating and managing form definitions for contact collection
 * 2. Supporting customizable field configurations for different data needs
 * 3. Enabling form integration with websites and landing pages
 *
 * Forms are a critical lead generation tool in Kibamail, allowing users
 * to collect contact information and other data through customizable
 * forms that can be embedded in websites, landing pages, or shared via links.
 */
export class FormController extends BaseController {
  constructor(
    protected app = makeApp(),
    protected formRepository = container.make(FormRepository),
  ) {
    super()

    this.app.defineRoutes(
      [
        ['POST', '/', this.create.bind(this)],
        ['GET', '/', this.index.bind(this)],
        ['PUT', '/:formId', this.update.bind(this)],
        ['DELETE', '/:formId', this.delete.bind(this)],
      ],
      {
        prefix: 'audiences/:audienceId/forms',
      },
    )

    // TODO: On the website block, a user can drag and drop a block that includes a form, or a block form independently.
    // once they do, on the right hand settings sidebar, they can select which form to attach to this form block.
    // we auto generate the form based on the selected form.
  }

  /**
   * Creates a new form for an audience.
   *
   * Validates the form definition and creates a new form with the specified
   * fields and configuration. Each field is assigned a unique ID to ensure
   * proper tracking and data mapping when the form is submitted.
   */
  async create(ctx: HonoContext) {
    const audience = await this.ensureExists<Audience>(ctx, 'audienceId')
    const payload = await this.validate(ctx, CreateFormSchema, {
      audienceId: audience.id,
    })

    const form = await this.formRepository.forms().create({
      ...payload,
      audienceId: audience.id,
      fields: payload.fields?.map((field) => ({
        ...field,
        id: field?.id || cuid(),
      })),
    })

    return ctx.json(form)
  }

  /**
   * Ensures that a requested form exists and belongs to the specified audience.
   *
   * Validates that the form ID is valid and that the form belongs to the
   * audience specified in the request path. This prevents unauthorized
   * access to forms across different audiences.
   */
  async ensureFormExists(ctx: HonoContext) {
    const form = await this.formRepository.forms().findById(ctx.req.param('formId'))

    if (!form) {
      throw E_VALIDATION_FAILED([
        {
          message: 'Form not found.',
          field: 'formId',
        },
      ])
    }

    if (form.audienceId !== ctx.req.param('audienceId')) {
      throw E_VALIDATION_FAILED([
        {
          message: 'Form not found in audience.',
          field: 'formId',
        },
      ])
    }

    return form
  }

  /**
   * Updates an existing form.
   *
   * Modifies a form's configuration, fields, or settings based on
   * the provided update data. Ensures the user has permission to
   * manage forms in the audience.
   */
  async update(ctx: HonoContext) {
    this.ensureCanManage(ctx)
    await this.ensureExists<Audience>(ctx, 'audienceId')

    const payload = await this.validate(ctx, UpdateFormSchema)

    const form = await this.ensureFormExists(ctx)

    await this.formRepository.update(form, payload)

    return ctx.json({ id: form.id })
  }

  /**
   * Deletes a form.
   *
   * Permanently removes a form from the system. This operation cannot
   * be undone, and any references to this form in websites or embeds
   * will no longer function.
   */
  async delete(ctx: HonoContext) {
    this.ensureCanManage(ctx)
    await this.ensureExists<Audience>(ctx, 'audienceId')
    const form = await this.ensureFormExists(ctx)

    await this.formRepository.delete(form)

    return ctx.json({ id: form.id })
  }

  /**
   * Lists all forms for an audience.
   *
   * Returns a collection of forms that belong to the specified audience.
   * Currently only performs authorization check.
   */
  async index(ctx: HonoContext) {
    this.ensureCanView(ctx)
  }

  /**
   * Retrieves a specific form.
   *
   * Method stub for retrieving detailed information about a specific form.
   * Not yet implemented.
   */
  async get(ctx: HonoContext) {}
}
