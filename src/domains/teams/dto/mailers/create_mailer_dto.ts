import { z } from "zod"

export const CreateMailerSchema = z.object({
  name: z.string(),
  provider: z.enum(["AWS_SES", "MAILGUN", "POSTMARK"]),
})

export type CreateMailerDto = z.infer<typeof CreateMailerSchema>
