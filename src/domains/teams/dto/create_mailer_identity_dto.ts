import { z } from "zod"

export const CreateMailerIdentitySchema = z
  .object({
    value: z.string(),
    type: z.enum(["EMAIL", "DOMAIN"]),
  })
  .superRefine((data, ctx) => {
    if (data.type === "EMAIL") {
      if (!z.string().email().safeParse(data.value).success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Value must be a valid email.",
          path: ["value"],
        })
      }
    } else if (data.type === "DOMAIN") {
      if (
        !/^(?!:\/\/)([a-zA-Z0-9-_]+(\.[a-zA-Z0-9-_]+)+.*)$/.test(data.value)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Value must be a valid domain.",
          path: ["value"],
        })
      }
    }
  })

export type CreateMailerIdentityDto = z.infer<typeof CreateMailerIdentitySchema>
