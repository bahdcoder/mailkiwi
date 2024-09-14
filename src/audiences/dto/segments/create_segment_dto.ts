import {
  type InferInput,
  array,
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

export const FilterConditionSchema = object({
  field: picklist([
    "email",
    "firstName",
    "lastName",
    "subscribedAt",
    "tags",
  ]),
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
