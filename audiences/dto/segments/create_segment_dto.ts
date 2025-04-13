import {
  type InferInput,
  array,
  check,
  nonEmpty,
  number,
  object,
  picklist,
  pipe,
  string,
  union,
} from 'valibot'

const allowedFilterFields = [
  'email',
  'firstName',
  'lastName',
  'subscribedAt',
  'tags',

  // Subscribed, unsubscribed, archived.
  'status',

  // website, import, api, manual, etc.
  'source',

  // sent events
  'lastSentBroadcastEmailAt',
  'lastSentAutomationEmailAt',

  // open events
  'lastOpenedBroadcastEmailAt',
  'lastOpenedAutomationEmailAt',

  // click events
  'lastClickedBroadcastEmailLinkAt',
  'lastClickedAutomationEmailLinkAt',

  // device and location
  'lastTrackedActivityFrom',
  'lastTrackedActivityUsingDevice',
  'lastTrackedActivityUsingBrowser',

  // segmentId
  'segmentId',
] as const

export type AllowedFilterField = (typeof allowedFilterFields)[number]

const AllowedFilterFieldPickList = picklist(allowedFilterFields)

export type AllowedFilterFieldPickList = typeof AllowedFilterFieldPickList

export const FilterConditionSchema = object({
  field: pipe(
    string(),
    check(
      (input) =>
        allowedFilterFields.includes(input as AllowedFilterField) ||
        input.startsWith('properties.'),
      `Only the following fields are allowed: ${allowedFilterFields.join(
        ', ',
      )}, properties.*`,
    ),
  ) as unknown as AllowedFilterFieldPickList,
  operation: picklist([
    'eq',
    'ne',
    'gt',
    'lt',
    'gte',
    'lte',
    'in',
    'nin',
    'startsWith',
    'endsWith',
    'contains',
    'notContains',
    'inTimeWindow',
  ]),
  value: union([string(), array(string()), number(), array(number())]),
})

export const FilterConditionGroupSchema = object({
  type: picklist(['AND', 'OR']),
  conditions: array(FilterConditionSchema),
})

export const FilterGroupsSchema = object({
  type: picklist(['AND', 'OR']),
  groups: array(FilterConditionGroupSchema),
})

export const CreateSegmentSchema = object({
  name: pipe(string(), nonEmpty()),
  filterGroups: FilterGroupsSchema,
})

export type CreateSegmentDto = InferInput<typeof CreateSegmentSchema>
