import { faker } from "@faker-js/faker"
import { describe, test } from "vitest"

import { makeApp, makeDatabase } from "@/infrastructure/container"
import { createUser } from "@/tests/mocks/auth/users"
import { injectAsUser } from "@/tests/utils/http"

describe("Audiences", () => {
  test("can create an audience only if authenticated", async ({ expect }) => {
    const app = makeApp()

    const response = await app.inject({
      method: "POST",
      path: "/audiences",
    })

    expect(response.statusCode).toBe(400)
  })

  test("can create an audience when properly authenticated and authorized", async ({
    expect,
  }) => {
    const { user } = await createUser()
    const database = makeDatabase()

    const payload = {
      name: "Newsletter",
    }

    const response = await injectAsUser(user, {
      method: "POST",
      path: "/audiences",
      body: payload,
    })

    const json = await response.json()

    const audience = await database.audience.findFirst({
      where: {
        teamId: user?.teams?.[0]?.id,
      },
    })

    expect(audience).not.toBeNull()
    expect(audience?.name).toEqual(payload.name)

    expect(response.statusCode).toBe(200)
    expect(json.data.id).toBeDefined()
    expect(json.data.name).toBe(payload.name)
    expect(json.data.teamId).toBe(user?.teams?.[0]?.id)
  })

  test("can only create an audience when properly authorized", async ({
    expect,
  }) => {
    const { user } = await createUser()
    const { user: unauthorizedUser } = await createUser()

    const response = await injectAsUser(user, {
      method: "POST",
      path: "/audiences",
      body: {
        name: "Newsletter",
      },
      headers: {
        "x-bamboomailer-team-id": unauthorizedUser?.teams?.[0]?.id,
      },
    })

    expect(response.statusCode).toBe(401)
  })
})

describe("Contacts", () => {
  test("can create a contact for an audience", async ({ expect }) => {
    const { user, audience } = await createUser()

    const contactPayload = {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.exampleEmail(),
      audienceId: audience.id,
    }

    const response = await injectAsUser(user, {
      method: "POST",
      path: "/contacts",
      body: contactPayload,
    })
    const json = await response.json()

    expect(response.statusCode).toEqual(200)
    expect(json.data.firstName).toEqual(contactPayload.firstName)
    expect(json.data.lastName).toEqual(contactPayload.lastName)
    expect(json.data.email).toEqual(contactPayload.email)
  })

  test("cannot create a contact with invalid data", async ({ expect }) => {
    const { user, audience } = await createUser()

    const contactPayload = {
      audienceId: audience.id,
    }

    const response = await injectAsUser(user, {
      method: "POST",
      path: "/contacts",
      body: contactPayload,
    })

    const json = await response.json()

    expect(response.statusCode).toEqual(400)
    expect(json.errors[0].field).toEqual("email")
  })
})
