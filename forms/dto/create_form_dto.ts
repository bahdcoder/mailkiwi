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

const QuestionEnabledConditionSchema = object({
  questionId: pipe(string(), uuid()),
  answer: string(),
  operator: picklist(["equal", "includes"]),
})

const QuestionSchema = object({
  id: pipe(string(), uuid()),
  label: pipe(string(), nonEmpty()),
  description: optional(string()),
  type: picklist(["email", "text", "number", "date", "select"]),
  options: optional(pipe(array(string()), minLength(2), maxLength(8))),
  conditions: optional(
    pipe(array(QuestionEnabledConditionSchema), maxLength(2)),
  ),
})

export const CreateFormSchema = pipe(
  object({
    name: string(),
    type: picklist(["signup", "survey"]),
    fields: pipe(array(QuestionSchema), minLength(1), maxLength(10)),
    appearance: picklist(["popover", "inline", "floating", "fullscreen"]),
  }),
  check(function (form) {
    if (form.type === "survey") {
      for (const question of form.fields) {
        if (question.type !== "select") {
          return false
        }
      }
    }

    return true
  }, 'If the form type is "survey", only "select" questions are allowed.'),
  check(function (form) {
    if (!form.fields[0].conditions) {
      return true
    }
    return form.fields[0].conditions.length === 0
  }, "The first question cannot have any conditions."),
  check(function (form) {
    if (form.type === "survey") {
      return true
    }

    const emailField = form.fields.find((field) => field.type === "email")

    return emailField !== undefined
  }, 'The form must have an "email" field if the type is "signup".'),
)

export type CreateFormDto = InferInput<typeof CreateFormSchema>
