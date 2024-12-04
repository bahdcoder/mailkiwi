import {
  Appearance,
  FieldSchema,
  firstQuestionHasNoConditionsCheck,
  signupFormMustHaveAnEmailFieldCheck,
  surveyHasOneSelectTypesCheck,
} from "./create_form_dto.js"
import {
  type InferInput,
  array,
  maxLength,
  minLength,
  object,
  optional,
  pipe,
  string,
} from "valibot"

export const UpdateFormSchema = pipe(
  object({
    name: optional(string()),
    fields: optional(pipe(array(FieldSchema), minLength(1), maxLength(10))),
    appearance: optional(Appearance),
  }),
  firstQuestionHasNoConditionsCheck,
  signupFormMustHaveAnEmailFieldCheck,
  surveyHasOneSelectTypesCheck,
)

export type UpdateFormDto = InferInput<typeof UpdateFormSchema>
