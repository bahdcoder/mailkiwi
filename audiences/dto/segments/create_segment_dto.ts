import {
  type InferInput,
  array,
  check,
  maxLength,
  minLength,
  nonEmpty,
  number,
  object,
  picklist,
  pipe,
  record,
  string,
  union,
} from "valibot"

const allowedFilterFields = [
  "email",
  "firstName",
  "lastName",
  "subscribedAt",
  "tags",

  // sent events
  "lastSentBroadcastEmailAt",
  "lastSentAutomationEmailAt",

  // open events
  "lastOpenedBroadcastEmailAt",
  "lastOpenedAutomationEmailAt",

  // click events
  "lastClickedBroadcastEmailLinkAt",
  "lastClickedAutomationEmailLinkAt",

  // device and location
  "lastTrackedActivityFrom",
  "lastTrackedActivityUsingDevice",
  "lastTrackedActivityUsingBrowser",
] as const

type AllowedFilterField = (typeof allowedFilterFields)[number]

const AllowedFilterFieldPickList = picklist(allowedFilterFields)

export type AllowedFilterFieldPickList = typeof AllowedFilterFieldPickList

export const FilterConditionSchema = object({
  field: pipe(
    string(),
    check(
      function (input) {
        return (
          allowedFilterFields.includes(input as AllowedFilterField) ||
          input.startsWith("properties.")
        )
      },
      `Only the following fields are allowed: ${allowedFilterFields.join(", ")}, properties.*`,
    ),
  ) as unknown as AllowedFilterFieldPickList,
  operation: picklist([
    "eq",
    "ne",
    "gt",
    "lt",
    "gte",
    "lte",
    "in",
    "nin",
    "startsWith",
    "endsWith",
    "contains",
    "notContains",
    "inTimeWindow",
  ]),
  value: union([string(), array(string()), number(), array(number())]),
})

export const FilterConditionGroupSchema = object({
  type: picklist(["AND", "OR"]),
  conditions: array(FilterConditionSchema),
})

export const FilterGroupsSchema = object({
  type: picklist(["AND", "OR"]),
  groups: array(FilterConditionGroupSchema),
})

export const CreateSegmentSchema = object({
  name: pipe(string(), nonEmpty()),
  filterGroups: FilterGroupsSchema,
})

export type CreateSegmentDto = InferInput<typeof CreateSegmentSchema>
