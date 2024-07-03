import { makeDatabase } from "@/infrastructure/container"
import { z } from "zod"

export const CreateUserSchema = z.object({
  email: z
    .string()
    .email()
    .refine(async (email) => {
      const database = makeDatabase()

      const userWithEmailExists = await database.user.findFirst({
        where: {
          email,
        },
      })

      return userWithEmailExists === null
    }, "A user with this email already exists."),
  name: z.string().min(2).max(32),
  password: z
    .string()
    .min(8)
    .max(32)
    .refine(
      (password) => /[A-Z]/.test(password),
      "Must contain capital letter.",
    )
    .refine(
      (password) => /[a-z]/.test(password),
      "Must contain lowercase letter.",
    )
    .refine((password) => /[0-9]/.test(password), "Must contain a number.")
    .refine(
      (password) => /[!@#$%^&*]/.test(password),
      "Must contain a special character.",
    ),
})

export type CreateUserDto = z.infer<typeof CreateUserSchema>
