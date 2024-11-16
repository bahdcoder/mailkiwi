import { Appearance, FieldSchema } from "./create_form_dto.js"
import {
  type InferInput,
  array,
  maxLength,
  minLength,
  object,
  optional,
  pipe,
  string,
} from "valibot"

export const UpdateFormSchema = object({
  name: optional(string()),
  fields: optional(pipe(array(FieldSchema), minLength(1), maxLength(10))),
  appearance: optional(Appearance),
})

export type UpdateFormDto = InferInput<typeof UpdateFormSchema>
