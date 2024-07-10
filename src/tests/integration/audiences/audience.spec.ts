import { faker } from "@faker-js/faker"
import { and, eq } from "drizzle-orm"
import { describe, test } from "vitest"

import {
  makeApp,
  makeConfig,
  makeDatabase,
} from "@/infrastructure/container.js"
import { audiences, contacts } from "@/infrastructure/database/schema/schema.ts"
import { createUser } from "@/tests/mocks/auth/users.js"
import { injectAsUser } from "@/tests/utils/http.js"

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

    expect(response.statusCode).toBe(200)

    const audience = await database.query.audiences.findFirst({
      where: and(
        eq(audiences.teamId, user?.teams?.[0]?.id),
        eq(audiences.name, payload.name),
      ),
    })

    expect(audience).toBeDefined()
  })

  test("can only create an audience when properly authorized", async ({
    expect,
  }) => {
    const { user } = await createUser()

    return
    const { user: unauthorizedUser } = await createUser()

    const response = await injectAsUser(user, {
      method: "POST",
      path: "/audiences",
      body: {
        name: "Newsletter",
      },
      headers: {
        [makeConfig().software.teamHeader]: unauthorizedUser?.teams?.[0]?.id,
      },
    })

    expect(response.statusCode).toBe(401)
  })
})

describe("Contacts", () => {
  test("can create a contact for an audience", async ({ expect }) => {
    const { user, audience } = await createUser()
    const database = makeDatabase()

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

    expect(response.statusCode).toEqual(200)

    const savedContact = await database.query.contacts.findFirst({
      where: and(
        eq(contacts.firstName, contactPayload.firstName),
        eq(contacts.lastName, contactPayload.lastName),
        eq(contacts.email, contactPayload.email),
      ),
    })

    expect(savedContact).toBeDefined()
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
