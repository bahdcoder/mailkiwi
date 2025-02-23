import { eq } from 'drizzle-orm'
import {
  type InferInput,
  array,
  boolean,
  check,
  enum as enum_,
  object,
  optional,
  pipe,
  string,
} from 'valibot'

enum PropertyType {
  boolean = 'boolean',
  float = 'float',
  date = 'date',
  text = 'text',
  enum = 'enum',
  list = 'list',
}

export const UpdateAudienceSchema = pipe(
  object({
    name: optional(string()),
    properties: optional(
      array(
        object({
          id: string(),
          label: string(),
          description: optional(string()),
          options: optional(array(string())),
          default: optional(string()),
          canContactUpdate: optional(boolean()),
          type: enum_(PropertyType),
          archived: optional(boolean()),
        }),
      ),
    ),
  }),
  check(function customPropertiesOfTypeEnumMustHaveOptions(input) {
    if (!input.properties) {
      return true
    }

    const enumProperties = input.properties.filter((property) => property.type === 'enum')

    if (enumProperties.length === 0) {
      return true
    }

    return enumProperties.every(
      (property) => property.options && property.options.length > 0,
    )
  }, 'Custom contact properties of type enum must have a list of options.'),
)

export type UpdateAudienceDto = InferInput<typeof UpdateAudienceSchema>
