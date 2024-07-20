import { InferInput, object, picklist, string } from "valibot"

export const CreateMailerSchema = object({
  name: string(),
  provider: picklist(["AWS_SES", "MAILGUN", "POSTMARK"] as const),
})

export type CreateMailerDto = InferInput<typeof CreateMailerSchema>
