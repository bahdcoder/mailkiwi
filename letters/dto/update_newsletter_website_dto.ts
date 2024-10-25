import { type InferInput, objectAsync } from "valibot"

export const UpdateNewsletterWebsiteSchema = objectAsync({})

export type UpdateNewsletterWebsiteDto = InferInput<
  typeof UpdateNewsletterWebsiteSchema
>
