import { eq } from "drizzle-orm"
import {
  checkAsync,
  email,
  InferInput,
  maxLength,
  objectAsync,
  pipe,
  pipeAsync,
  regex,
  string,
} from "valibot"

import { makeDatabase } from "@/infrastructure/container.js"
import { users } from "@/infrastructure/database/schema/schema.js"

export const CreateUserSchema = objectAsync({
  email: pipeAsync(
    string(),
    email(),
    checkAsync(async (input) => {
      const database = makeDatabase()

      const userExists = await database.query.users.findFirst({
        where: eq(users.email, input),
      })

      return userExists === undefined
    }, "A user with this email already exists."),
  ),
  name: pipe(string(), maxLength(50)),
  password: pipe(
    string(),
    regex(/[A-Z]/, "Must contain capital letter."),
    regex(/[a-z]/, "Must contain lowercase letter."),
    regex(/[0-9]/, "Must contain a number."),
    regex(/[!@#$%^&*]/, "Must contain a special character."),
  ),
})

export type CreateUserDto = InferInput<typeof CreateUserSchema>
