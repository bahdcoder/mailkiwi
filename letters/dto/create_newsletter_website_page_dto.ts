import { BlockContentSchema } from "@/letters/dto/update_newsletter_website_page_dto.js"
import {
  type InferInput,
  maxLength,
  minLength,
  object,
  objectAsync,
  optional,
  picklist,
  pipe,
  string,
} from "valibot"

export const CreateNewsletterWebsitePageSchema = objectAsync({
  draftWebsiteContent: object({
    type: picklist(["doc"]),
    content: BlockContentSchema,
  }),
  path: pipe(string(), minLength(2), maxLength(24)),
  title: optional(pipe(string(), minLength(10), maxLength(72))),
  description: optional(string()),
})

export type CreateNewsletterWebsitePageDto = InferInput<
  typeof CreateNewsletterWebsitePageSchema
>
