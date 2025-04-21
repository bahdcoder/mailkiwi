import {
  type GenericSchema,
  type InferInput,
  array,
  lazy,
  maxLength,
  minLength,
  number,
  object,
  objectAsync,
  optional,
  picklist,
  pipe,
  record,
  string,
  union,
} from 'valibot'

const htmlJsonTypes = [
  'doc',
  'container',
  'columns',
  'column',
  'paragraph',
  'heading',
  'text',
] as const
const htmlJsonContentType = picklist(htmlJsonTypes)

export type HTMLJsonBlock = {
  type: (typeof htmlJsonTypes)[number]
  attrs: Record<string, string>
  content: HTMLJsonBlock[]
  text?: string
}

export const BlockContentSchema = array(
  object({
    type: htmlJsonContentType,
    text: optional(string()),
    attrs: optional(record(string(), union([string(), number(), array(string())]))),
    content: optional(lazy(() => BlockContentSchema)),
  }),
) as GenericSchema<HTMLJsonBlock[]>

export const UpdateWebsitePageSchema = objectAsync({
  draftWebsiteContent: optional(
    object({
      type: picklist(['doc']),
      content: BlockContentSchema,
    }),
  ),
  slug: optional(pipe(string(), minLength(2), maxLength(24))),
  title: optional(pipe(string(), minLength(10), maxLength(100))),
  description: optional(string()),
})

export type UpdateWebsitePageDto = InferInput<typeof UpdateWebsitePageSchema>
