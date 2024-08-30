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
} from "valibot"

// Create something flexible enough to work as a landing page builder.

type CorneredStyle = {
  top: number
  right: number
  bottom: number
  left: number
}

type Element = {
  name: string
  type:
    | "container"
    | "text"
    | "image"
    | "video"
    | "grid"
    | "grid-item"
    | "button"
    | "anchor" // an href
    | "divider"
  styles: {
    width?: string
    margin?: CorneredStyle
    padding?: CorneredStyle
    borderRadius?: CorneredStyle
    fontFamily?: {
      name: string
      url: string
    }
    backgroundColor?: string
  }
  elements?: Element[]
}
// grid => <mj-section></mj-section>
// grid-item => <mj-column></mj-column>

const CorneredStyleSchema = object({
  top: number(),
  right: number(),
  bottom: number(),
  left: number(),
})

const CorneredFlexibleStyleSchema = object({
  top: string(),
  right: string(),
  bottom: string(),
  left: string(),
})

export const StyleSchema = object({
  width: optional(string()),
  margin: optional(CorneredStyleSchema),
  padding: optional(CorneredStyleSchema),
  borderRadius: optional(CorneredStyleSchema),
  border: optional(CorneredStyleSchema),
  borderColor: optional(CorneredFlexibleStyleSchema),
  fontFamily: optional(
    object({
      url: string(),
      name: string(),
    }),
  ),
  backgroundColor: optional(string()),
  "min-height": optional(number()),
})

export const EmailSectionSchema = object({
  // These are all base types, and blocks are a construction of base types combined together.
  name: pipe(string(), nonEmpty(), minLength(3), maxLength(30)),
  type: picklist([
    "text",
    "image",
    "video",
    "grid",
    "grid-item",
    "button",
    "anchor", // an href
    "divider",
  ]),
  elements: lazy(() => EmailSectionSchema), // beyond this level, we cannot add any more grid or grid item elements. we can add any of the others.
  styles: StyleSchema,
}) as GenericSchema<Element>

export const EmailContentSchema = object({
  sections: array(EmailSectionSchema),
  wrapper: object({ styles: StyleSchema }), // the inner container
  container: object({ styles: StyleSchema }), // the outer container
})

export type EmailContentSchemaDto = InferInput<typeof EmailContentSchema>
export type EmailSectionSchemaDto = InferInput<typeof EmailSectionSchema>
export type EmailContentStyleSchemaDto = InferInput<typeof StyleSchema>
