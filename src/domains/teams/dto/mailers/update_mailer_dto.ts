import { z } from "zod"
import { $Enums } from "@prisma/client"

export const UpdateMailerSchema = z.object({
  configuration: z.object({
    accessKey: z.string().optional(),
    accessSecret: z.string().optional(),
    region: z.string().optional(),
    domain: z.string().optional(),
    maximumMailsPerSecond: z.number().optional(),
  }),
})

export type UpdateMailerDto = z.infer<typeof UpdateMailerSchema>
