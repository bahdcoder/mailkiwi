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
} from 'valibot'

export const CreateSegmentSchema = object({
  name: pipe(string(), nonEmpty()),
  conditions: pipe(
    array(
      object({
        field: picklist([
          'email',
          'firstName',
          'lastName',
          'subscribedAt',
          'tags',
        ]),
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
        ]),
        value: union([string(), array(string()), number(), array(number())]),
      }),
    ),
    minLength(1),
    maxLength(5),
  ),
})

export type CreateSegmentDto = InferInput<typeof CreateSegmentSchema>
