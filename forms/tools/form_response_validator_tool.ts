import { FormFieldDto } from "@/forms/dto/create_form_dto.js"

import { Form, FormResponse } from "@/database/database_schema_types.js"

export class FormResponseValidatorTool {
  constructor(
    protected form: Form,
    protected payload: NonNullable<FormResponse["response"]>,
  ) {}

  async handle() {
    if (!this.form.fields) {
      return { valid: true, errors: {} }
    }

    const errors: Record<string, string | undefined> = {}

    for (const field of this.form.fields) {
      switch (field.type) {
        case "select":
          errors[field.id!] = this.validateSelectField(field)
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

  protected validateSelectField(field: FormFieldDto) {
    const value = this.payload[field.id!]

    if (!value) {
      return "This field is required"
    }

    if (!field.options?.includes(value?.[0])) {
      return "Please select a valid option"
    }
  }
}
