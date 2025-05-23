import type { FormFieldDto } from '#root/core/forms/dto/create_form_dto.js'
import { email, pipe, safeParse, string } from 'valibot'

import type { Form, FormResponse } from '#root/database/database_schema_types.js'

export class FormResponseValidatorTool {
  constructor(
    protected form: Form,
    protected payload: NonNullable<FormResponse['response']>,
  ) {}

  async handleSignupForm() {
    return { valid: true, errors: {} }
  }

  async handle() {
    if (!this.form.fields) {
      return { valid: true, errors: {} }
    }

    if (this.form.type === 'signup') {
      return this.handleSignupForm()
    }

    const errors: Record<string, string | undefined> = {}

    for (const field of this.form.fields) {
      switch (field.type) {
        case 'select':
          if (field.id) errors[field.id] = this.validateSelectField(field)
          break
        case 'email':
          if (field.id) errors[field.id] = this.validateEmailField(field)
          break
        default:
          break
      }
    }

    return {
      errors,
      valid: Object.values(errors).length > 0,
    }
  }

  protected validateEmailField(field: FormFieldDto) {
    const value = field.id ? this.payload[field.id] : undefined

    const { success } = safeParse(pipe(string(), email()), value)

    if (!success) {
      return 'Please enter a valid email address'
    }
  }

  protected validateSelectField(field: FormFieldDto) {
    const value = field.id ? this.payload[field.id] : undefined

    if (!value) {
      return 'This field is required'
    }

    if (!field.options?.includes(value?.[0])) {
      return 'Please select a valid option'
    }
  }
}
