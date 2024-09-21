import { apiEnv } from "@/api/env/api_env.js"
import { faker } from "@faker-js/faker"
import { and, eq } from "drizzle-orm"
import { readFile } from "fs/promises"
import { resolve } from "path"
import { describe, test } from "vitest"

import { CreateTagAction } from "@/audiences/actions/tags/create_tag_action.js"
import { ContactImportRepository } from "@/audiences/repositories/contact_import_repository.js"

import { AccessTokenRepository } from "@/auth/acess_tokens/repositories/access_token_repository.js"

import { createUser } from "@/tests/mocks/auth/users.js"
import { makeRequestAsUser } from "@/tests/utils/http.js"

import { ContactImport } from "@/database/schema/database_schema_types.js"
import { contactImports, contacts } from "@/database/schema/schema.js"

import { makeApp, makeDatabase } from "@/shared/container/index.js"
import { Queue } from "@/shared/queue/queue.js"
import { getAuthenticationHeaders } from "@/shared/utils/auth/get_auth_headers.js"

import { container } from "@/utils/typi.js"

export const setupImport = async (
  fileName: string,
  updateSettings = false,
) => {
  const form = new FormData()

  const contactsCsv = await readFile(
    resolve(__dirname, "mocks", fileName),
    "utf-8",
  )

  const contactsCsvBlob = new Blob([contactsCsv], {
    type: "text/csv",
  })

  form.append("file", contactsCsvBlob)

  const { audience, user, team } = await createUser()

  const { accessKey, accessSecret } = await container
    .make(AccessTokenRepository)
    .create(user.id, "user")

  const app = makeApp()

  const response = await app.request(`/audiences/${audience.id}/imports`, {
    method: "POST",
    body: form,
    headers: {
      [apiEnv.software.teamHeader]: team.id.toString(),
      ...getAuthenticationHeaders(accessKey, accessSecret.release()),
    },
  })

  const database = makeDatabase()

  let contactImport: ContactImport | null = null
  const imports = await database
    .select()
    .from(contactImports)
    .where(eq(contactImports.audienceId, audience.id))

  if (updateSettings) {
    const importId = imports?.[0]?.id

    const mockTag = await container
      .make(CreateTagAction)
      .handle({ name: faker.lorem.word() }, audience.id)

    await makeRequestAsUser(user, {
      method: "PUT",
      path: `/audiences/${audience.id}/imports/${importId}`,
      body: {
        subscribeAllContacts: false,
        tagIds: [mockTag.id],
        tags: ["interested-in-book", "ecommerce-prospects"],
        attributesMap: {
          firstName: "First Name",
          lastName: "Last Name",
          email: "Email",
          attributes: [
            "Index",
            "Customer Id",
            "Company",
            "City",
            "Country",
            "Phone 1",
            "Phone 2",
            "Subscription Date",
            "Website",
          ],
        },
      },
    })

    const updatedContactImport = await container
      .make(ContactImportRepository)
      .findById(importId)

    if (updatedContactImport) {
      contactImport = updatedContactImport
    }
  }

  return { response, imports, user, audience, contactImport }
}

describe.concurrent("@contacts", () => {
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

describe.concurrent("@contacts update", () => {
  test("can update the first name, last name, avatar and attributes of a contact", async ({
    expect,
  }) => {
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
      attributes: {
        hobby: "reading",
        favoriteColor: "blue",
      },
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

  test("cannot update without proper authorisation", async ({
    expect,
  }) => {
    const { user, audience, team } = await createUser()
    const { user: unauthorizedUser } = await createUser()
    const database = makeDatabase()

    // Create a contact
    const createContactResponse = await makeRequestAsUser(
      user,
      {
        method: "POST",
        path: `/audiences/${audience.id}/contacts`,
        body: { email: faker.internet.email() },
      },
      team.id,
    )
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

describe.concurrent("@contacts imports", () => {
  test("can import contacts into an audience as a csv file", async ({
    expect,
  }) => {
    const { response, imports } = await setupImport("contacts.csv")

    expect(response.status).toBe(200)

    expect(imports).toHaveLength(1)
    expect(imports[0].status).toBe("PENDING")
    expect(imports[0].attributesMap).toMatchObject({
      email: "Email",
      lastName: "Last Name",
      firstName: "First Name",
      attributes: [
        "Index",
        "Customer Id",
        "Company",
        "City",
        "Country",
        "Phone 1",
        "Phone 2",
        "Subscription Date",
        "Website",
      ],
    })
  })

  test("can begin processing by updating processing settings and status", async ({
    expect,
  }) => {
    const { imports, user, audience } = await setupImport("contacts.csv")

    const importId = imports?.[0]?.id

    const response = await makeRequestAsUser(user, {
      method: "PUT",
      path: `/audiences/${audience.id}/imports/${importId}`,
      body: {
        subscribeAllContacts: false,
        tags: [],
        tagIds: [],
        attributesMap: {
          firstName: "First Name",
          lastName: "Last Name",
          email: "Email",
          attributes: [
            "Index",
            "Customer Id",
            "Company",
            "City",
            "Country",
            "Phone 1",
            "Phone 2",
            "Subscription Date",
            "Website",
          ],
        },
      },
    })

    expect(response.status).toBe(200)

    const contactImport = await container
      .make(ContactImportRepository)
      .findById(importId)

    expect(contactImport?.status).toBe("PROCESSING")

    const jobs = await Queue.contacts().getJobs()

    expect(jobs[0].data).toEqual({ contactImportId: contactImport?.id })
  })

  test("can only import valid csv files", async ({}) => {})
})

describe.concurrent("@contacts exports", () => {
  test("can export all contacts matching provided filterGroups", async ({
    expect,
  }) => {
    const { user, audience } = await createUser()

    const filterGroups = {
      type: "OR",
      groups: [
        {
          type: "AND",
          conditions: [
            {
              field: "email",
              operation: "startsWith",
              value: "xx",
            },
          ],
        },
        {
          type: "AND",
          conditions: [
            {
              field: "firstName",
              operation: "contains",
              value: "xxx",
            },
          ],
        },
      ],
    }

    await makeRequestAsUser(user, {
      method: "POST",
      path: `/audiences/${audience.id}/exports`,
      body: {
        filterGroups,
      },
    })

    const jobs = await Queue.contacts().getJobs()

    expect(jobs[0].data.filterGroups).toMatchObject(filterGroups)
  })
})
