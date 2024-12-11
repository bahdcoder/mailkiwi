import { faker } from "@faker-js/faker"
import { eq } from "drizzle-orm"
import { DateTime } from "luxon"
import { describe, test } from "vitest"

import { UserRepository } from "@/auth/users/repositories/user_repository.js"

import { createUser } from "@/tests/mocks/auth/users.js"
import { makeRequest, makeRequestAsUser } from "@/tests/utils/http.js"

import { users } from "@/database/schema.js"

import { makeApp, makeDatabase } from "@/shared/container/index.js"
import { route } from "@/shared/routes/route_aliases.js"
import { RedisSessionStore } from "@/shared/sessions/stores/redis_session_store.js"
import { OtpGenerator } from "@/shared/tokens/otp_generator.js"

import { container } from "@/utils/typi.js"

describe("@auth user registration", () => {
  test("can register a new user account", async ({ expect }) => {
    const database = makeDatabase()

    const payload = {
      email: faker.internet.exampleEmail(),
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
  })

  test("can only register with an email once and not twice", async ({ expect }) => {
    const app = makeApp()

    const { user } = await createUser()

    const response = await app.request("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: user.email,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    })

    const json = await response.json()

    expect(response.status).toEqual(422)
    expect(json.payload.errors).toMatchObject([
      {
        message:
          "A user with this email already exists. Are you trying to login instead?",
      },
    ])
  })

  test("can confirm email with verification code and set new password", async ({
    expect,
  }) => {
    const database = makeDatabase()

    const payload = {
      email: faker.number.bigInt() + faker.internet.exampleEmail(),
    }

    const MOCK_VERIFICATION_CODE = 123456

    container.fake(OtpGenerator, {
      generate() {
        return MOCK_VERIFICATION_CODE
      },
    })

    const response = await makeRequest(route("auth_register"), {
      method: "POST",
      body: payload,
    })

    expect(response.status).toBe(200)

    const json = await response.json()

    expect(json.type).toBe("redirect")
    expect(json.payload.path).toBe(route("auth_register_email_confirm"))

    const [user] = await database
      .select()
      .from(users)
      .where(eq(users.email, payload.email))

    const userWithTeams = await container.make(UserRepository).findById(user.id)

    const emailConfirmResponse = await makeRequestAsUser(userWithTeams, {
      method: "POST",
      path: route("auth_register_email_confirm"),
      body: {
        code: MOCK_VERIFICATION_CODE.toString(),
      },
    })

    const emailConfirmJson = await emailConfirmResponse.json()

    expect(emailConfirmResponse.status).toBe(200)

    expect(emailConfirmJson.type).toBe("redirect")
    expect(emailConfirmJson.payload.path).toBe(route("auth_register_password"))

    const [updatedUser] = await database
      .select()
      .from(users)
      .where(eq(users.email, payload.email))

    expect(updatedUser.emailVerificationCode).toBeNull()

    container.restoreAll()

    const NEW_PASSWORD = "new-123-Password"

    const setPasswordResponse = await makeRequestAsUser(userWithTeams, {
      method: "POST",
      path: route("auth_register_password"),
      body: {
        password: NEW_PASSWORD,
      },
    })

    const setPasswordJson = await setPasswordResponse.json()

    expect(setPasswordJson.type).toBe("redirect")
    expect(setPasswordJson.payload.path).toBe(route("auth_register_profile"))

    const setProfileResponse = await makeRequestAsUser(userWithTeams, {
      method: "POST",
      path: route("auth_register_profile"),
      body: {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        teamName: faker.company.name(),
      },
    })

    const setProfileJson = await setProfileResponse.json()

    expect(setProfileJson.type).toBe("redirect")
    expect(setProfileJson.payload.path).toBe(route("welcome"))

    const headers = {
      "x-forwarded-for": "160.212.38.149",
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36",
    }

    await container.make(RedisSessionStore).clear(user.id)

    const loginResponse = await makeRequest(route("auth_login"), {
      method: "POST",
      body: {
        email: payload.email,
        password: NEW_PASSWORD,
      },
      headers,
    })

    const redisSessionsForUser = await container.make(RedisSessionStore).list(user.id)

    expect(redisSessionsForUser).toHaveLength(1)

    expect(loginResponse.headers.getSetCookie()?.[0]).toMatch("__Secure-session=")
  })
})

describe("@auth user login", () => {
  test("a user can login to their account and get a valid cookie session", async ({
    expect,
  }) => {
    const { user, team } = await createUser()

    const headers = {
      "x-forwarded-for": "160.212.38.149",
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36",
    }

    const response = await makeRequest("/auth/login", {
      method: "POST",
      body: {
        email: user.email,
        password: "password",
      },
      headers,
    })

    const redisSessionsForUser = await container.make(RedisSessionStore).list(user.id)

    expect(redisSessionsForUser).toHaveLength(1)

    expect(redisSessionsForUser).toEqual([
      {
        ip: headers["x-forwarded-for"],
        userAgent: headers["user-agent"],
        userId: user.id,
        currentTeamId: team.id,
        expiresAt: expect.any(String),
        createdAt: expect.any(String),
      },
    ])

    const expiry = DateTime.fromISO(redisSessionsForUser?.[0]?.expiresAt)
      .diffNow()
      .as("days")

    expect(expiry).toBeGreaterThan(29)

    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.type).toBe("redirect")

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
    expect(profile.email).toBe(user.email)
  })

  test("a user cannot login with wrong credentials.", async ({ expect }) => {
    const { user } = await createUser()
    const app = makeApp()

    const response = await app.request("/auth/login", {
      method: "post",
      body: JSON.stringify({
        email: user.email,
        password: "invalid-password",
      }),
      headers: {
        "Content-Type": "application/json",
      },
    })

    const json = await response.json()

    expect(response.status).toBe(422)
    expect(json.payload.errors[0].message).toBe(
      "These credentials do not match our records.",
    )
  })

  test("can logout, destroying currently active session", async ({ expect }) => {
    const { user } = await createUser()

    const response = await makeRequestAsUser(user, {
      method: "POST",
      body: {},
      path: "/auth/logout",
    })

    expect(response.status).toBe(200)

    const userSessions = await container.make(RedisSessionStore).list(user.id)

    expect(userSessions).toHaveLength(0)
  })
})
