import { eq } from "drizzle-orm"
import { z } from "zod"

import { makeDatabase } from "@/infrastructure/container.js"
import { users } from "@/infrastructure/database/schema/schema.ts"

export const CreateUserSchema = z.object({
  email: z
    .string()
    .email()
    .refine(async (email) => {
      const database = makeDatabase()

      const userWithEmailExists = await database.query.users.findFirst({
        where: eq(users.email, email),
      })

      return userWithEmailExists === undefined
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
