import { eq } from "drizzle-orm"
import {
  type InferInput,
  array,
  boolean,
  check,
  object,
  optional,
  pipe,
  string,
  enum as enum_,
} from "valibot"

enum PropertyType {
  boolean = "boolean",
  float = "float",
  date = "date",
  text = "text",
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
      })
    )
  ),
})

export type UpdateAudienceDto = InferInput<typeof UpdateAudienceSchema>
