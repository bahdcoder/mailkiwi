import { eq } from "drizzle-orm"
import {
  type InferInput,
  checkAsync,
  email,
  maxLength,
  objectAsync,
  pipe,
  pipeAsync,
  regex,
  string,
} from "valibot"

import { UserRepository } from "@/auth/users/repositories/user_repository.js"

import { users } from "@/database/schema.js"

import { makeDatabase } from "@/shared/container/index.js"

import { container } from "@/utils/typi.js"

export const CreateUserSchema = objectAsync({
  email: pipeAsync(
    string(),
    email(),
    checkAsync(async (input) => {
      await container.make(UserRepository).findByEmail(input)

      const userExists = await container.make(UserRepository).findByEmail(input)

      return userExists === undefined
    }, "A user with this email already exists. Are you trying to login instead?"),
  ),
})

export type CreateUserDto = InferInput<typeof CreateUserSchema>
