import { faker } from "@faker-js/faker"
import { eq } from "drizzle-orm"
import { foreignKey, primaryKey } from "drizzle-orm/mysql-core"
import { describe, test } from "vitest"

import { TeamRepository } from "@/teams/repositories/team_repository.js"

import { UserRepository } from "@/auth/users/repositories/user_repository.js"

import { createUser } from "@/tests/mocks/auth/users.js"
import { makeRequest } from "@/tests/utils/http.js"

import {
  broadcasts,
  segments,
  teamMemberships,
  teams,
  users,
} from "@/database/schema/schema.js"
import { hasMany, hasOne } from "@/database/utils/relationships.js"

import { makeApp, makeDatabase } from "@/shared/container/index.js"
import { getAuthenticationHeaders } from "@/shared/utils/auth/get_auth_headers.js"
import { fromQueryResultToPrimaryKey } from "@/shared/utils/database/primary_keys.js"

import { container } from "@/utils/typi.js"

describe("@auth user registration", () => {
  test("can register a new user account", async ({ expect }) => {
    const database = makeDatabase()

    const payload = {
      name: faker.person.fullName(),
      email: faker.internet.exampleEmail(),
      password: "@Dx93opPisxYee#$%^",
    }

    const response = await makeRequest("/auth/register", {
      method: "POST",
      body: payload,
    })

    const userFromDatabase = await database.query.users.findFirst({
      where: eq(users.email, payload.email),
    })

    expect(response.status).toBe(200)

    expect(userFromDatabase).toBeDefined()
    expect(userFromDatabase?.name).toEqual(payload.name)
  })

  test("registering a new user account automatically creates a team for that user.", async ({
    expect,
  }) => {
    const payload = {
      name: faker.person.fullName(),
      email: faker.internet.exampleEmail(),
      password: "@Dx93opPisxYee#$%^",
    }

    await makeRequest("/auth/register", {
      method: "POST",
      body: payload,
    })

    const userRepository = container.make(UserRepository)

    const user = await userRepository.findByEmail(payload.email)

    const userWithTeams = await userRepository.findById(user.id)

    expect(user).not.toBeNull()
    expect(userWithTeams?.teams).toHaveLength(1)
    expect(userWithTeams.teams?.[0]?.name).toEqual(payload.name)
  })

  test("can only register with an email once and not twice", async ({
    expect,
  }) => {
    const app = makeApp()

    const { user } = await createUser()

    const response = await app.request("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: faker.person.fullName(),
        email: user.email,
        password: "@Dx93opPisxYee#$%^",
      }),
    })

    const json = await response.json()

    expect(response.status).toEqual(422)
    expect(json.errors).toMatchObject([
      {
        message: "A user with this email already exists.",
      },
    ])
  })
})

describe("@auth user login", () => {
  test("a user can login to their account and get a valid cookie session", async ({
    expect,
  }) => {
    const { user } = await createUser()

    const response = await makeRequest("/auth/login", {
      method: "POST",
      body: {
        email: user.email,
        password: "password",
      },
    })

    expect(response.status).toBe(200)

    const [sessionCookie] = response.headers.getSetCookie()

    expect(sessionCookie).toBeDefined()

    const profileResponse = await makeRequest("/auth/profile", {
      method: "GET",
      headers: {
        Cookie: sessionCookie,
      },
    })

    const profile = await profileResponse.json()

    expect(profile.id).toBe(user.id)
    expect(profile.name).toBe(user.name)
    expect(profile.email).toBe(user.email)
  })

  test("a user cannot login with wrong credentials.", async ({
    expect,
  }) => {
    const { user } = await createUser()
    const app = makeApp()

    const response = await app.request("/auth/login", {
      method: "post",
      body: JSON.stringify({
        email: user.email,
        password: "invalid-password",
      }),
    })

    const json = await response.json()

    expect(response.status).toBe(422)
    expect(json.errors[0].message).toBe(
      "These credentials do not match our records.",
    )
  })
})
