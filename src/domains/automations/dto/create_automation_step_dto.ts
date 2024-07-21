import {
  object,
  string,
  optional,
  number,
  InferInput,
  objectAsync,
  pipeAsync,
  picklist,
  checkAsync,
  safeParse,
  union,
  array,
  literal,
  record,
  pipe,
  nonEmpty,
} from "valibot"
import {
  audiences,
  automationSteps,
  automationStepSubtypes,
  automationStepTypes,
  automationStepSubtypesTrigger,
  automationStepSubtypesRule,
  automationStepSubtypesEnd,
  tags,
  automationStepSubtypesAction,
} from "@/infrastructure/database/schema/schema.ts"
import { makeDatabase } from "@/infrastructure/container.ts"
import { and, eq, isNull } from "drizzle-orm"

const configurationSchema = record(
  string(),
  union([string(), array(string()), number(), array(number())]),
)
export const CreateAutomationStepDto = pipeAsync(
  objectAsync({
    type: picklist(automationStepTypes),
    subtype: picklist(automationStepSubtypes),
    configuration: record(
      string(),
      union([
        string(),
        array(string()),
        number(),
        array(number()),
        array(record(string(), union([string(), array(string())]))),
        configurationSchema,
      ]),
    ),
    parentId: pipeAsync(
      optional(string()),
      checkAsync(async (input) => {
        if (!input) return true

        const database = makeDatabase()

        const [automationStep, automationStepWithParent] = await Promise.all([
          database.query.automationSteps.findFirst({
            where: eq(automationSteps.id, input),
          }),
          database.query.automationSteps.findFirst({
            where: eq(automationSteps.parentId, input),
          }),
        ])

        return (
          automationStep !== undefined && automationStepWithParent === undefined
        )
      }, "The parentId must be a valid automation step ID and must not be linked to another automation step."),
    ),
    emailId: pipeAsync(
      optional(string()),
      checkAsync(async (input) => {
        if (!input) return true

        const database = makeDatabase()

        const existingEmail = await database.query.emails.findFirst({
          where: eq(audiences.id, input),
        })

        return existingEmail !== undefined
      }),
    ),
    audienceId: pipeAsync(
      optional(string()),
      checkAsync(async (input) => {
        if (!input) return true

        const database = makeDatabase()

        const existingAudience = await database.query.audiences.findFirst({
          where: eq(audiences.id, input),
        })

        return existingAudience !== undefined
      }),
    ),
    tagId: pipeAsync(
      optional(string()),
      checkAsync(async (input) => {
        if (!input) return true

        const database = makeDatabase()

        const existingTag = await database.query.tags.findFirst({
          where: eq(tags.id, input),
        })

        return existingTag !== undefined
      }),
    ),
    branchIndex: optional(number()),
  }),
  checkAsync((input) => {
    if (input.type === "TRIGGER") {
      return safeParse(picklist(automationStepSubtypesTrigger), input.subtype)
        .success
    }

    return true
  }, "The subtype must be valid for the type trigger."),
  checkAsync((input) => {
    if (input.type === "RULE") {
      return safeParse(picklist(automationStepSubtypesRule), input.subtype)
        .success
    }

    return true
  }, "The subtype must be valid for the type rule."),
  checkAsync((input) => {
    if (input.type === "ACTION") {
      return safeParse(picklist(automationStepSubtypesAction), input.subtype)
        .success
    }

    return true
  }, "The subtype must be valid for the type action."),
  checkAsync((input) => {
    if (input.type === "END") {
      return safeParse(picklist(automationStepSubtypesEnd), input.subtype)
        .success
    }

    return true
  }, "The subtype must be valid for the type END."),
  checkAsync((input) => {
    if (input.subtype === "RULE_IF_ELSE") {
      return safeParse(
        object({
          conditions: array(
            object({
              field: union([
                literal("email"),
                literal("firstName"),
                literal("lastName"),
                literal("tags"),
                literal("subscriptionDate"),
              ]),
              operator: union([
                literal("EQUAL"),
                literal("NOT_EQUAL"),
                literal("CONTAINS"),
                literal("NOT_CONTAINS"),
                literal("STARTS_WITH"),
                literal("ENDS_WITH"),
                literal("GREATER_THAN"),
                literal("LESS_THAN"),
                literal("BLANK"),
                literal("NOT_BLANK"),
              ]),
              value: union([
                string(),
                number(),
                array(string()),
                array(number()),
              ]),
            }),
          ),
        }),
        input.configuration,
      ).success
    }

    return true
  }, "The configuration object for RULE_IF_ELSE is malformed."),
  checkAsync((input) => {
    if (input.subtype === "ACTION_UPDATE_CONTACT_ATTRIBUTES") {
      return safeParse(
        object({
          add: configurationSchema,
          remove: configurationSchema,
        }),
        input.configuration,
      ).success
    }

    return true
  }, "The configuration object is malformed for ACTION_UPDATE_CONTACT_ATTRIBUTES."),
  checkAsync(async (input) => {
    if (input.subtype === "ACTION_SEND_EMAIL") {
      return safeParse(pipe(string(), nonEmpty()), input.emailId).success
    }

    return true
  }, "The emailId must be present for subtype ACTION_SEND_EMAIL."),
  checkAsync(async (input) => {
    if (
      input.subtype === "ACTION_ADD_TAG" ||
      input.subtype === "ACTION_REMOVE_TAG"
    ) {
      return safeParse(pipe(string(), nonEmpty()), input.tagId).success
    }

    return true
  }, "The tagId must be present for subtype ACTION_ADD_TAG and ACTION_REMOVE_TAG."),
  checkAsync(async (input) => {
    if (
      input.subtype === "ACTION_SUBSCRIBE_TO_AUDIENCE" ||
      input.subtype === "ACTION_UNSUBSCRIBE_FROM_AUDIENCE"
    ) {
      return safeParse(pipe(string(), nonEmpty()), input.audienceId).success
    }

    return true
  }, "The audienceId must be present for subtype ACTION_SUBSCRIBE_TO_AUDIENCE and ACTION_UNSUBSCRIBE_FROM_AUDIENCE."),
)

export type CreateAutomationStepDto = InferInput<typeof CreateAutomationStepDto>
