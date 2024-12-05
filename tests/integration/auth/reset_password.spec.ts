import { faker } from "@faker-js/faker"
import { randomBytes } from "crypto"
import { eq } from "drizzle-orm"
import { describe, expect, it } from "vitest"

import { PasswordResetRepository } from "@/auth/password_resets/repositories/password_reset_repository.js"

import { createUser } from "@/tests/mocks/auth/users.js"
import { makeRequest } from "@/tests/utils/http.js"

import { passwordResets } from "@/database/schema.js"

import { TokenGenerator } from "@/shared/tokens/token_generator.js"

import { container } from "@/utils/typi.js"

describe("@auth password resets", () => {
  it("a user can request and reset their password", async ({ expect }) => {
    const { user } = await createUser()

    const passwordResetToken = randomBytes(32).toString("hex")

    container.fake(TokenGenerator, {
      generate() {
        return passwordResetToken
      },
    })

    const response = await makeRequest("/auth/passwords/forgot", {
      method: "POST",
      body: {
        email: user.email,
      },
    })

    expect(response.status).toBe(200)

    const getUserPasswordResets = () => container.make(PasswordResetRepository).resets().findAll(eq(passwordResets.userId, user.id))

    const [userPasswordReset] = await getUserPasswordResets()

    expect(userPasswordReset).toBeDefined()

    const newPassword = faker.internet.password()

    const resetResponse = await makeRequest(`/auth/passwords/reset/${passwordResetToken}`, {
      method: "POST",
      body: {
        email: user.email,
        password: newPassword,
      },
    })

    expect(resetResponse.status).toBe(200)

    const updatedUserPasswordResets = await getUserPasswordResets()

    expect(updatedUserPasswordResets).toHaveLength(0)

    const loginResponse = await makeRequest("/auth/login/", {
      method: "POST",
      body: {
        email: user.email,
        password: newPassword,
      },
    })

    expect(loginResponse.status).toBe(302)
    expect(loginResponse.headers.get("location")).toBe("/")
    expect(loginResponse.headers.get("set-cookie")).toContain("__Secure-session=")
  })
})
