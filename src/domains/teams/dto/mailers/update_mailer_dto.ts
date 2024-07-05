import { Secret } from "@poppinss/utils"
import { z } from "zod"

export const UpdateMailerSchema = z.object({
  configuration: z
    .object({
      accessKey: z.string().optional(),
      accessSecret: z.string().optional(),
      region: z
        .enum([
          "us-east-2",
          "us-east-1",
          "us-west-1",
          "us-west-2",
          "af-south-1",
          "ap-south-1",
          "ap-northeast-3",
          "ap-northeast-2",
          "ap-southeast-1",
          "ap-southeast-2",
          "ap-northeast-1",
          "ca-central-1",
          "cn-northwest-1",
          "eu-central-1",
          "eu-west-1",
          "eu-west-2",
          "eu-south-1",
          "eu-west-3",
          "eu-north-1",
          "me-south-1",
          "sa-east-1",
          "us-gov-west-1",
        ])
        .optional(),
      domain: z.string().optional(),
      email: z.string().optional(),
      maximumMailsPerSecond: z.number().optional(),
    })
    .superRefine((data, ctx) => {
      if (!data.domain && !data.email) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Either domain or email must be provided to enable sending emails.",
          path: ["domain", "email"],
        })
      }
    })
    .transform((value) => ({
      ...value,
      accessKey: new Secret(value.accessKey ?? ""),
      accessSecret: new Secret(value.accessSecret ?? ""),
    })),
})

export type UpdateMailerDto = z.infer<typeof UpdateMailerSchema>
