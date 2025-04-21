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
}

export const UpdateAudienceSchema = object({
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
})

export type UpdateAudienceDto = InferInput<typeof UpdateAudienceSchema>
