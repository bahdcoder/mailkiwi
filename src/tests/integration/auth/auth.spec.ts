import { faker } from "@faker-js/faker"
import { eq } from "drizzle-orm"
import { describe, test } from "vitest"

import { makeApp, makeDatabase } from "@/infrastructure/container.js"
import { users } from "@/infrastructure/database/schema/schema.ts"
import { createUser } from "@/tests/mocks/auth/users.js"
import { injectAsUser } from "@/tests/utils/http.js"

describe("User registration", () => {
  test("can register a new user account", async ({ expect }) => {
    const app = makeApp()
    const database = makeDatabase()

    const payload = {
      name: faker.person.fullName(),
      email: faker.internet.exampleEmail(),
      password: "@Dx93opPisxYee#$%^",
    }

    const response = await app.inject({
      method: "POST",
      path: "/auth/register",
      body: payload,
    })

    const userFromDatabase = await database.query.users.findFirst({
      where: eq(users.email, payload.email),
    })

    expect(response.statusCode).toBe(200)

    expect(userFromDatabase).toBeDefined()
    expect(userFromDatabase?.name).toEqual(payload.name)
  })

  test("registering a new user account automatically creates a team for that user.", async ({
    expect,
  }) => {
    const app = makeApp()
    const database = makeDatabase()

    const payload = {
      name: faker.person.fullName(),
      email: faker.internet.exampleEmail(),
      password: "@Dx93opPisxYee#$%^",
    }

    await app.inject({
      method: "POST",
      path: "/auth/register",
      body: payload,
    })

    const user = await database.query.users.findFirst({
      where: eq(users.email, payload.email),
      with: {
        teams: true,
      },
    })

    expect(user).not.toBeNull()
    expect(user?.teams).toHaveLength(1)
    expect(user?.teams?.[0]?.name).toEqual(payload.name)
    expect(user?.teams?.[0]?.configurationKey).toBeDefined()
  })

  test("can only register with an email once and not twice", async ({
    expect,
  }) => {
    const app = makeApp()

    const { user } = await createUser()

    const response = await app.inject({
      method: "POST",
      path: "/auth/register",
      body: {
        name: faker.person.fullName(),
        email: user.email,
        password: "@Dx93opPisxYee#$%^",
      },
    })

    const json = response.json()

    expect(response.statusCode).toEqual(400)
    expect(json.errors).toMatchObject([
      {
        message: "A user with this email already exists.",
      },
    ])
  })
})

describe("User login", () => {
  test("a user can login to their account and get a valid access token", async ({
    expect,
  }) => {
    const { user } = await createUser()
    const app = makeApp()

    const response = await app.inject({
      method: "POST",
      path: "/auth/login",
      body: {
        email: user.email,
        password: "password",
      },
    })

    const json = await response.json()

    expect(response.statusCode).toBe(200)
    expect(json.accessToken.type).toBe("bearer")
    expect(json.accessToken.token).toBeDefined()
    expect(() => new Date(json.accessToken.expiresAt)).not.toThrowError()

    const profileResponse = await injectAsUser(user, {
      method: "GET",
      path: "/auth/profile",
      headers: {
        authorization: `Bearer ${json.accessToken.token}`,
      },
    })

    const profile = await profileResponse.json()

    expect(profile.id).toBe(user.id)
    expect(profile.name).toBe(user.name)
    expect(profile.email).toBe(user.email)
  })

  test("a user cannot login with wrong credentials.", async ({ expect }) => {
    const { user } = await createUser()
    const app = makeApp()

    const response = await app.inject({
      method: "POST",
      path: "/auth/login",
      body: {
        email: user.email,
        password: "invalid-password",
      },
    })

    const json = await response.json()

    expect(response.statusCode).toBe(400)
    expect(json.errors[0].message).toBe(
      "These credentials do not match our records.",
    )
  })
})
