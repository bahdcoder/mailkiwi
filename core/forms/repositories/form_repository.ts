import type { UpdateFormDto } from '#root/core/forms/dto/update_form_dto.js'
import { DateTime } from 'luxon'

import type { Form } from '#root/database/database_schema_types.js'
import { forms } from '#root/database/schema.js'

import { BaseRepository } from '#root/core/shared/repositories/base_repository.js'

export class FormRepository extends BaseRepository {
  forms() {
    return this.crud(forms)
  }

  async update(form: Form, payload: UpdateFormDto) {
    const fields: Form['fields'] = []

    if (payload.fields) {
      for (const field of payload.fields) {
        const exists = form.fields?.find((formField) => formField.id === field.id)

        if (!exists) {
          fields.push({ ...field, id: this.cuid() })

          continue
        }

        fields.push({ ...exists, ...field, id: exists.id })
      }

      if (form.fields) {
        for (const field of form.fields) {
          const exists = payload.fields.find(
            (payloadField) => payloadField.id === field.id,
          )

          if (!exists) {
            fields.push({ ...field, deleted: true })
          }
        }
      }

      payload.fields = fields
    }

    await this.forms().update(form.id, payload)

    return { id: form.id }
  }

  async delete(form: Form) {
    await this.forms().update(form.id, {
      archivedAt: DateTime.now().toJSDate(),
    })

    return form
  }
}
