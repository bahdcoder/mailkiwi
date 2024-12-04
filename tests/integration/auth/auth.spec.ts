import { faker } from "@faker-js/faker"
import { eq } from "drizzle-orm"
import { DateTime } from "luxon"
import { describe, test } from "vitest"

import { UserRepository } from "@/auth/users/repositories/user_repository.js"

import { createUser } from "@/tests/mocks/auth/users.js"
import { makeRequest, makeRequestAsUser } from "@/tests/utils/http.js"

import { users } from "@/database/schema.js"

import { makeApp, makeDatabase } from "@/shared/container/index.js"
import { OtpGenerator } from "@/shared/otp/otp_generator.js"
import { RedisSessionStore } from "@/shared/sessions/stores/redis_session_store.js"

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

    expect(response.status).toBe(302)

    expect(userFromDatabase).toBeDefined()
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
    expect(userWithTeams.teams?.[0]?.name).toEqual(user?.id)
  })

  test("can only register with an email once and not twice", async ({ expect }) => {
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
      email: faker.internet.exampleEmail(),
    }

    container.fake(OtpGenerator, {
      generate() {
        return 123456
      },
    })

    const response = await makeRequest("/auth/register", {
      method: "POST",
      body: payload,
    })

    expect(response.status).toBe(302)

    const [user] = await database
      .select()
      .from(users)
      .where(eq(users.email, payload.email))

    const userWithTeams = await container.make(UserRepository).findById(user.id)

    const emailConfirmResponse = await makeRequestAsUser(userWithTeams, {
      method: "POST",
      path: "/auth/register/email/confirm",
      body: {
        code: 123456,
      },
    })

    expect(emailConfirmResponse.status).toBe(302)
    expect(emailConfirmResponse.headers.get("Location")).toEqual(
      "/auth/register/password",
    )

    const [updatedUser] = await database
      .select()
      .from(users)
      .where(eq(users.email, payload.email))

    expect(updatedUser.emailVerificationCode).toBeNull()

    container.restoreAll()

    const setPasswordResponse = await makeRequestAsUser(userWithTeams, {
      method: "POST",
      path: "/auth/register/password/",
      body: {
        password: "new-123-Password",
      },
    })

    expect(setPasswordResponse.status).toEqual(302)
    expect(setPasswordResponse.headers.get("Location")).toEqual("/welcome")

    const loginResponse = await makeRequestAsUser(userWithTeams, {
      method: "POST",
      path: "/auth/login",
      body: {
        email: payload.email,
        password: "new-123-Password",
      },
    })

    expect(loginResponse.headers.getSetCookie()?.[0]).toMatch("__Secure-session=")
  })
})

describe("@auth user login", () => {
  test("a user can login to their account and get a valid cookie session", async ({
    expect,
  }) => {
    const { user } = await createUser()

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
        expiresAt: expect.any(String),
        createdAt: expect.any(String),
      },
    ])

    const expiry = DateTime.fromISO(redisSessionsForUser?.[0]?.expiresAt)
      .diffNow()
      .as("days")

    expect(expiry).toBeGreaterThan(29)

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

  test("a user cannot login with wrong credentials.", async ({ expect }) => {
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
    expect(json.errors[0].message).toBe("These credentials do not match our records.")
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
