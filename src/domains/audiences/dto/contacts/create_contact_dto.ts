import * as v from "valibot"

export const CreateContactSchema = v.object({
  email: v.string(),
  audienceId: v.string(),
  firstName: v.optional(v.string()),
  lastName: v.optional(v.string()),
})

export type CreateContactDto = v.InferInput<typeof CreateContactSchema>
