import {
  type InferInput,
  array,
  boolean,
  email,
  maxLength,
  minLength,
  nonEmpty,
  object,
  optional,
  pipe,
  record,
  string,
} from 'valibot'

const EnvelopeSchema = object(
  {
    email: pipe(string(), nonEmpty(), email('Please provide a valid email.')),
    name: optional(string()),
  },
  'A valid email and/or name is required.',
)

const AttachmentSchema = object({
  data: pipe(string(), nonEmpty()),
  base64: boolean(),
  contentType: string(),
  contentId: optional(string()),
  name: optional(string()),
})

export const InjectEmailSchema = object({
  from: EnvelopeSchema,
  subject: string('A valid email subject is required.'),
  recipients: pipe(
    array(EnvelopeSchema, 'At least one recipient is required.'),
    minLength(1, 'At least one recipient is required.'),
    maxLength(50, 'At most 50 recipients are allowed.'),
  ),
  html: optional(
    pipe(string('A valid html body is required.'), nonEmpty(), maxLength(256_000)),
  ),
  text: pipe(string('A valid text body is required..'), nonEmpty(), maxLength(256_000)),
  replyTo: optional(EnvelopeSchema),
  headers: optional(record(string(), string())),
  attachments: optional(array(AttachmentSchema)),
  openTrackingEnabled: optional(boolean()),
  clickTrackingEnabled: optional(boolean()),
})

export type InjectEmailSchemaDto = InferInput<typeof InjectEmailSchema>
