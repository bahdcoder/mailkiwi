import { z } from "zod"
import { $Enums } from "@prisma/client"

export const CreateMailerSchema = z.object({
  name: z.string(),
  provider: z.enum([
    $Enums.MailerProvider.AWS_SES,
    $Enums.MailerProvider.MAILGUN,
    $Enums.MailerProvider.POSTMARK,
  ]),
})

export type CreateMailerDto = z.infer<typeof CreateMailerSchema>
