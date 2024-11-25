import { FormFieldDto } from "@/forms/dto/create_form_dto.js"
import { email, pipe, safeParse, string } from "valibot"

import { Form, FormResponse } from "@/database/database_schema_types.js"

export class FormResponseValidatorTool {
  constructor(
    protected form: Form,
    protected payload: NonNullable<FormResponse["response"]>,
  ) {}

  async handleSignupForm() {
    return { valid: true, errors: {} }
  }

  async handle() {
    if (!this.form.fields) {
      return { valid: true, errors: {} }
    }

    if (this.form.type === "signup") {
      return this.handleSignupForm()
    }

    const errors: Record<string, string | undefined> = {}

    for (const field of this.form.fields) {
      switch (field.type) {
        case "select":
          errors[field.id!] = this.validateSelectField(field)
          break
        case "email":
          errors[field.id!] = this.validateEmailField(field)
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
    const value = this.payload[field.id!]

    const { success } = safeParse(pipe(string(), email()), value)

    if (!success) {
      return "Please enter a valid email address"
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
