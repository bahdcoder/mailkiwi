import {
  type GenericSchema,
  type InferInput,
  array,
  lazy,
  maxLength,
  minLength,
  nonEmpty,
  number,
  object,
  optional,
  picklist,
  pipe,
  string,
} from 'valibot'

// Create something flexible enough to work as a landing page builder.

type CorneredStyle = {
  top: number
  right: number
  bottom: number
  left: number
}

type Element = {
  name?: string
  value?: string
  type:
    | 'container'
    | 'section'
    | 'paragraph'
    | 'heading'
    | 'text' // this is a reserved type, that can only be used as children of other types. cannot have children of its own and cannot stand on its own. it is usually the child of a paragraph or heading or button.
    // when nested into one of these elements, there's usually many "text" in one element. that way, each segment of the text can have it's own style. Example, user highlights the first 4 characters of a string in a button on the frontend and makes it red, while the rest of the strong is blue. this will lead to creation of 2 "text" elements. the first part is red, the second part is blue.
    | 'image'
    | 'video'
    | 'grid'
    | 'grid-item'
    | 'button'
    | 'anchor' // an href
    | 'divider'
  styles: {
    width?: string
    margin?: CorneredStyle
    padding?: CorneredStyle
    borderRadius?: CorneredStyle
    verticalAlign?: string
    horizontalAlign?: string
    fontFamily?: {
      name: string
      url?: string
    }
    backgroundColor?: string
    color?: string
    textDecoration?: string
  }
  elements?: Element[]
  mobileStyles?: Element['styles']
  properties?: {
    href?: {
      url: string
    }
  }
}

// grid => <mj-section></mj-section>
// grid-item => <mj-column></mj-column>

export const CorneredStyleSchema = object({
  top: number(),
  right: number(),
  bottom: number(),
  left: number(),
})

export const CorneredFlexibleStyleSchema = object({
  top: string(),
  right: string(),
  bottom: string(),
  left: string(),
})

export const StyleSchema = object({
  width: optional(string()),
  verticalAlign: optional(string()),
  horizontalAlign: optional(string()),
  margin: optional(CorneredStyleSchema),
  padding: optional(CorneredStyleSchema),
  borderRadius: optional(CorneredStyleSchema),
  border: optional(CorneredStyleSchema),
  borderColor: optional(CorneredFlexibleStyleSchema),
  fontFamily: optional(
    object({
      url: optional(string()),
      name: string(),
    }),
  ),
  backgroundColor: optional(string()),
  color: optional(string()),
  'min-height': optional(number()),
})

export const PropertiesSchema = object({
  href: optional(
    object({
      url: string(),
    }),
  ),
})

export const EmailSectionSchema = object({
  // These are all base types, and blocks are a construction of base types combined together.
  name: pipe(string(), nonEmpty(), minLength(3), maxLength(30)),
  value: optional(string()),
  type: picklist([
    'text',
    'image',
    'video',
    'grid',
    'grid-item',
    'button',
    'anchor', // an href
    'divider',
  ]),
  elements: lazy(() => EmailSectionSchema), // beyond this level, we cannot add any more grid or grid item elements. we can add any of the others.
  styles: StyleSchema,
  mobileStyles: optional(StyleSchema),
  properties: PropertiesSchema,
  // Content could be anything really, but we use this validation schema to limit what could be passed to the backend.
}) as GenericSchema<Element>

export const EmailContentSchema = object({
  sections: array(EmailSectionSchema),
  wrapper: object({ styles: StyleSchema }), // the inner container
  container: object({ styles: StyleSchema }), // the outer container
})

export type EmailContentSchemaDto = InferInput<typeof EmailContentSchema>
export type EmailContentCorneredStyle = InferInput<typeof CorneredStyleSchema>
export type EmailSectionSchemaDto = InferInput<typeof EmailSectionSchema>
export type EmailContentStyleSchemaDto = InferInput<typeof StyleSchema>
