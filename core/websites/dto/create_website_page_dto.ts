import { BlockContentSchema } from '#root/core/websites/dto/update_website_page_dto.js'
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
} from 'valibot'

export const CreateWebsitePageSchema = objectAsync({
  draftWebsiteContent: object({
    type: picklist(['doc']),
    content: BlockContentSchema,
  }),
  path: pipe(string(), minLength(2), maxLength(24)),
  title: optional(pipe(string(), minLength(10), maxLength(72))),
  description: optional(string()),
})

export type CreateWebsitePageDto = InferInput<typeof CreateWebsitePageSchema>
