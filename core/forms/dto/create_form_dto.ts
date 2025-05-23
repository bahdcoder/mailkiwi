import { eq } from 'drizzle-orm'
import {
  type InferInput,
  array,
  check,
  checkAsync,
  maxLength,
  minLength,
  nonEmpty,
  object,
  optional,
  picklist,
  pipe,
  pipeAsync,
  string,
  uuid,
} from 'valibot'

import { audiences } from '#root/database/schema.js'

import { makeDatabase } from '#root/core/shared/container/index.js'

export const QuestionEnabledConditionSchema = object({
  questionId: pipe(string(), uuid()),
  answer: string(),
  operator: picklist(['equal', 'includes']),
})

export const FieldType = picklist(['email', 'text', 'number', 'date', 'select'])

export const Appearance = picklist(['popover', 'inline', 'floating', 'fullscreen'])

export const AutoTaggingAutomationSchema = object({
  option: string(),
  tagId: array(pipe(string(), uuid())),
})

export const FieldSchema = object({
  id: optional(string()),
  label: pipe(string(), nonEmpty()),
  description: optional(string()),
  type: FieldType,
  options: optional(pipe(array(string()), minLength(2), maxLength(8))),
  conditions: optional(pipe(array(QuestionEnabledConditionSchema), maxLength(2))),
  autoTagging: optional(pipe(array(AutoTaggingAutomationSchema), maxLength(2))),
})

export const CreateFormObjectSchema = object({
  name: string(),
  type: picklist(['signup', 'survey']),
  fields: pipe(array(FieldSchema), minLength(1), maxLength(10)),
  appearance: Appearance,
  audienceId: pipe(string(), uuid()),
})

export function checkIfSurveyHasOnlySelectTypes(
  form: InferInput<typeof CreateFormObjectSchema>,
) {
  if (form.type === 'survey') {
    for (const question of form.fields) {
      if (question.type !== 'select') {
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
  if (!form.type) {
    return true
  }

  if (form.type === 'survey') {
    return true
  }

  const emailField = form.fields.find((field) => field.type === 'email')

  return emailField !== undefined
}

export const surveyHasOneSelectTypesCheck = check(
  checkIfSurveyHasOnlySelectTypes,
  'If the form type is "survey", only "select" questions are allowed.',
)

export const firstQuestionHasNoConditionsCheck = check(
  checkIfFirstQuestionsHasAnyConditions,
  'The first question cannot have any conditions.',
)

export const signupFormMustHaveAnEmailFieldCheck = check(
  checkIfFormSignupHasEmailField,
  'The form must have an "email" field if the type is "signup".',
)

export const signUpFormMustHaveKnownFieldsCheck = checkAsync(
  async (form: InferInput<typeof CreateFormObjectSchema>) => {
    if (form.type !== 'signup') {
      return true
    }

    const database = makeDatabase()

    const [audience] = await database
      .select({ knownProperties: audiences.knownProperties })
      .from(audiences)
      .where(eq(audiences.id, form.audienceId))

    if (!audience) {
      return false
    }

    const formFields = form.fields

    const allowedFields = [
      'email',
      'firstname',
      'lastname',
      ...(audience.knownProperties?.map((property) => property.id) ?? []),
    ]

    const hasUnknownFields = formFields.some(
      (field) => !allowedFields.includes(field.id as string),
    )

    return !hasUnknownFields
  },
  'The sign up form can only have "email", "firstname", "lastname", and any of your known custom fields',
)

// export const autoTaggingTagsAreAllValidCheck = check()

export const CreateFormSchema = pipeAsync(
  CreateFormObjectSchema,
  surveyHasOneSelectTypesCheck,
  firstQuestionHasNoConditionsCheck,
  signupFormMustHaveAnEmailFieldCheck,
  signUpFormMustHaveKnownFieldsCheck,
)

export type FormFieldDto = InferInput<typeof FieldSchema>

export type CreateFormDto = InferInput<typeof CreateFormSchema>
