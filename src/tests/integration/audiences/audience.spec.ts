import { faker } from "@faker-js/faker"
import { and, eq } from "drizzle-orm"
import { describe, test } from "vitest"

import { createUser } from "@/tests/mocks/auth/users.js"
import { refreshDatabase } from "@/tests/mocks/teams/teams.js"
import { makeRequest, makeRequestAsUser } from "@/tests/utils/http.js"

import { audiences, contacts } from "@/database/schema/schema.js"

import { makeConfig, makeDatabase } from "@/shared/container/index.js"

describe("Audiences", () => {
  test("can create an audience only if authenticated", async ({ expect }) => {
    const response = await makeRequest("audiences", {
      method: "POST",
    })

    expect(response.status).toBe(401)
  })

  test("can create an audience when properly authenticated and authorized", async ({
    expect,
  }) => {
    await refreshDatabase()

    const { user } = await createUser()
    const database = makeDatabase()

    const payload = {
      name: faker.commerce.productName(),
    }

    const response = await makeRequestAsUser(user, {
      method: "POST",
      path: "/audiences",
      body: payload,
    })

    expect(response.status).toBe(200)

    const audience = await database.query.audiences.findFirst({
      where: and(
        eq(audiences.teamId, user?.teams?.[0]?.id),
        eq(audiences.name, payload.name),
      ),
    })

    expect(audience).toBeDefined()
    expect(audience?.name).toEqual(payload.name)
  })

  test("can only create an audience when properly authorized", async ({
    expect,
  }) => {
    const { user } = await createUser()

    const { user: unauthorizedUser } = await createUser()

    const response = await makeRequestAsUser(user, {
      method: "POST",
      path: "/audiences",
      body: {
        name: "Newsletter",
      },
      headers: {
        [makeConfig().software.teamHeader]: unauthorizedUser?.teams?.[0]?.id,
      },
    })

    expect(response.status).toBe(401)
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

    const response = await makeRequestAsUser(user, {
      method: "POST",
      path: `/audiences/${audience.id}/contacts`,
      body: contactPayload,
    })

    expect(response.status).toEqual(200)

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

    const response = await makeRequestAsUser(user, {
      method: "POST",
      path: `/audiences/${audience.id}/contacts`,
      body: contactPayload,
    })

    const json = await response.json()

    expect(response.status).toEqual(422)
    expect(json.errors[0].field).toEqual("email")
  })
})

describe("Update contacts", () => {
  test("can update the first name, last name, avatar and attributes of a contact", async ({
    expect,
  }) => {
    await refreshDatabase()
    const { user, audience } = await createUser()
    const database = makeDatabase()

    // Create a contact
    const createContactResponse = await makeRequestAsUser(user, {
      method: "POST",
      path: `/audiences/${audience.id}/contacts`,
      body: { email: faker.internet.email() },
    })
    const { id: contactId } = await createContactResponse.json()

    const updateData = {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      avatarUrl: faker.image.url(),
      attributes: { hobby: "reading" },
    }

    const updateResponse = await makeRequestAsUser(user, {
      method: "PATCH",
      path: `/audiences/${audience.id}/contacts/${contactId}`,
      body: updateData,
    })

    expect(updateResponse.status).toBe(200)
    const { id: updatedContactId } = await updateResponse.json()

    const updatedContact = await database.query.contacts.findFirst({
      where: eq(contacts.id, updatedContactId),
    })

    expect(updatedContact).toMatchObject(updateData)
  })

  test("can override attributes", async ({ expect }) => {
    await refreshDatabase()
    const { user, audience } = await createUser()
    const database = makeDatabase()

    // Create a contact with initial attributes
    const createContactResponse = await makeRequestAsUser(user, {
      method: "POST",
      path: `/audiences/${audience.id}/contacts`,
      body: {
        email: faker.internet.email(),
        attributes: { hobby: "swimming", age: 25 },
      },
    })
    const { id: contactId } = await createContactResponse.json()

    const updateData = {
      attributes: { hobby: "reading", favoriteColor: "blue" },
    }

    const updateResponse = await makeRequestAsUser(user, {
      method: "PATCH",
      path: `/audiences/${audience.id}/contacts/${contactId}`,
      body: updateData,
    })

    expect(updateResponse.status).toBe(200)

    const { id: updatedContactId } = await updateResponse.json()

    const updatedContact = await database.query.contacts.findFirst({
      where: eq(contacts.id, updatedContactId),
    })

    expect(updatedContact?.attributes).toEqual({
      hobby: "reading",
      age: 25,
      favoriteColor: "blue",
    })
  })

  test("can merge attributes without deleting existing attributes", async ({
    expect,
  }) => {
    await refreshDatabase()
    const { user, audience } = await createUser()
    const database = makeDatabase()

    // Create a contact with initial attributes
    const createContactResponse = await makeRequestAsUser(user, {
      method: "POST",
      path: `/audiences/${audience.id}/contacts`,
      body: {
        email: faker.internet.email(),
        attributes: { hobby: "swimming", age: 25 },
      },
    })
    const { id: contactId } = await createContactResponse.json()

    const updateData = {
      attributes: { favoriteColor: "blue" },
    }

    const updateResponse = await makeRequestAsUser(user, {
      method: "PATCH",
      path: `/audiences/${audience.id}/contacts/${contactId}`,
      body: updateData,
    })

    expect(updateResponse.status).toBe(200)
    const { id: updatedContactId } = await updateResponse.json()

    const updatedContact = await database.query.contacts.findFirst({
      where: eq(contacts.id, updatedContactId),
    })

    expect(updatedContact?.attributes).toEqual({
      hobby: "swimming",
      age: 25,
      favoriteColor: "blue",
    })
  })

  test("cannot update without proper authorisation", async ({ expect }) => {
    await refreshDatabase()
    const { user, audience } = await createUser()
    const { user: unauthorizedUser } = await createUser()
    const database = makeDatabase()

    // Create a contact
    const createContactResponse = await makeRequestAsUser(user, {
      method: "POST",
      path: `/audiences/${audience.id}/contacts`,
      body: { email: faker.internet.email() },
    })
    const { id: contactId } = await createContactResponse.json()

    const updateData = {
      firstName: faker.person.firstName(),
    }

    const updateResponse = await makeRequestAsUser(unauthorizedUser, {
      method: "PATCH",
      path: `/audiences/${audience.id}/contacts/${contactId}`,
      body: updateData,
    })

    expect(updateResponse.status).toBe(401)
  })
})
