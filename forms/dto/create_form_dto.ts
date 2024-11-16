import {
  type InferInput,
  array,
  check,
  maxLength,
  minLength,
  nonEmpty,
  object,
  optional,
  picklist,
  pipe,
  string,
  uuid,
} from "valibot"

export const QuestionEnabledConditionSchema = object({
  questionId: pipe(string(), uuid()),
  answer: string(),
  operator: picklist(["equal", "includes"]),
})

export const FieldType = picklist([
  "email",
  "text",
  "number",
  "date",
  "select",
])

export const Appearance = picklist([
  "popover",
  "inline",
  "floating",
  "fullscreen",
])

export const FieldSchema = object({
  id: optional(pipe(string(), uuid())),
  label: pipe(string(), nonEmpty()),
  description: optional(string()),
  type: FieldType,
  options: optional(pipe(array(string()), minLength(2), maxLength(8))),
  conditions: optional(
    pipe(array(QuestionEnabledConditionSchema), maxLength(2)),
  ),
})

export const CreateFormObjectSchema = object({
  name: string(),
  type: picklist(["signup", "survey"]),
  fields: pipe(array(FieldSchema), minLength(1), maxLength(10)),
  appearance: Appearance,
})

export function checkIfSurveyHasOnlySelectTypes(
  form: InferInput<typeof CreateFormObjectSchema>,
) {
  if (form.type === "survey") {
    for (const question of form.fields) {
      if (question.type !== "select") {
        return false
      }
    }
  }

  return true
}

export function checkIfFirstQuestionsHasAnyConditions(
  form: InferInput<typeof CreateFormObjectSchema>,
) {
  if (!form.fields[0].conditions) {
    return true
  }
  return form.fields[0].conditions.length === 0
}

export function checkIfFormSignupHasEmailField(
  form: InferInput<typeof CreateFormObjectSchema>,
) {
  if (form.type === "survey") {
    return true
  }

  const emailField = form.fields.find((field) => field.type === "email")

  return emailField !== undefined
}

export const CreateFormSchema = pipe(
  CreateFormObjectSchema,
  check(
    checkIfSurveyHasOnlySelectTypes,
    'If the form type is "survey", only "select" questions are allowed.',
  ),
  check(
    checkIfFirstQuestionsHasAnyConditions,
    "The first question cannot have any conditions.",
  ),
  check(
    checkIfFormSignupHasEmailField,
    'The form must have an "email" field if the type is "signup".',
  ),
)

export type FormFieldDto = InferInput<typeof FieldSchema>

export type CreateFormDto = InferInput<typeof CreateFormSchema>
