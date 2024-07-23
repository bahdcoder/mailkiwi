import { faker } from "@faker-js/faker"
import { describe, test } from "vitest"
import { makeDatabase } from "@/infrastructure/container.js"
import { broadcasts } from "@/infrastructure/database/schema/schema.js"
import { createBroadcastForUser, createUser } from "@/tests/mocks/auth/users.js"
import { refreshDatabase } from "@/tests/mocks/teams/teams.js"
import { makeRequestAsUser } from "@/tests/utils/http.js"
import { eq } from "drizzle-orm"

describe("Create broadcasts", () => {
  test("can create a broadcast for an audience", async ({ expect }) => {
    await refreshDatabase()
    const { user, audience } = await createUser()
    const database = makeDatabase()

    const broadcastName = faker.lorem.words(3)
    const response = await makeRequestAsUser(user, {
      method: "POST",
      path: "/broadcasts",
      body: {
        name: broadcastName,
        audienceId: audience.id,
      },
    })

    const { id } = await response.json()

    expect(response.status).toBe(201)

    const createdBroadcast = await database.query.broadcasts.findFirst({
      where: eq(broadcasts.id, id),
    })

    expect(createdBroadcast).toBeDefined()
    expect(createdBroadcast?.name).toBe(broadcastName)
    expect(createdBroadcast?.audienceId).toBe(audience.id)
  })

  test("cannot create a broadcast without a valid name", async ({ expect }) => {
    await refreshDatabase()
    const { user, audience } = await createUser()

    const response = await makeRequestAsUser(user, {
      method: "POST",
      path: "/broadcasts",
      body: {
        name: "",
        audienceId: audience.id,
      },
    })

    const json = await response.json()

    expect(response.status).toBe(422)
    expect(json).toMatchObject({
      errors: [
        {
          message: "Invalid length: Expected !0 but received 0",
          field: "name",
        },
      ],
    })
  })

  test("cannot create a broadcast without a valid audience that exists in the database", async ({
    expect,
  }) => {
    await refreshDatabase()

    const { user } = await createUser()
    const database = makeDatabase()

    const response = await makeRequestAsUser(user, {
      method: "POST",
      path: "/broadcasts",
      body: {
        name: faker.lorem.words(3),
        audienceId: faker.string.uuid(),
      },
    })

    expect(response.status).toBe(422)

    const broadcastsCount = await database.query.broadcasts.findMany()

    expect(broadcastsCount).toHaveLength(0)
  })
})

describe("Update broadcasts", () => {
  test("can update a broadcast with valid data", async ({ expect }) => {
    await refreshDatabase()
    const { user, audience } = await createUser()
    const database = makeDatabase()
    const broadcastId = await createBroadcastForUser(user, audience.id)

    const updateData = {
      name: faker.lorem.words(3),
      fromName: faker.person.fullName(),
      fromEmail: faker.internet.email(),
      replyToEmail: faker.internet.email(),
      replyToName: faker.person.fullName(),
      subject: faker.lorem.sentence(),
      previewText: faker.lorem.sentence(),
    }

    const response = await makeRequestAsUser(user, {
      method: "PUT",
      path: `/broadcasts/${broadcastId}`,
      body: updateData,
    })

    expect(response.status).toBe(200)
    const updatedBroadcast = await database.query.broadcasts.findFirst({
      where: eq(broadcasts.id, broadcastId),
    })

    expect(updatedBroadcast).toMatchObject(updateData)
  })

  test("cannot update a broadcast with an invalid audience ID", async ({
    expect,
  }) => {
    await refreshDatabase()
    const { user, audience } = await createUser()
    const broadcastId = await createBroadcastForUser(user, audience.id)

    const response = await makeRequestAsUser(user, {
      method: "PUT",
      path: `/broadcasts/${broadcastId}`,
      body: {
        audienceId: faker.string.uuid(),
      },
    })

    expect(response.status).toBe(422)
    expect(await response.json()).toMatchObject({
      errors: [
        {
          message: expect.stringMatching("Invalid input: Received"),
          field: "audienceId",
        },
      ],
    })
  })

  test("cannot update a broadcast with invalid email addresses", async ({
    expect,
  }) => {
    await refreshDatabase()
    const { user, audience } = await createUser()
    const broadcastId = await createBroadcastForUser(user, audience.id)

    const response = await makeRequestAsUser(user, {
      method: "PUT",
      path: `/broadcasts/${broadcastId}`,
      body: {
        fromEmail: "invalid-email",
        replyToEmail: "also-invalid",
      },
    })

    expect(response.status).toBe(422)
    expect(await response.json()).toMatchObject({
      errors: [
        {
          message: expect.stringMatching("Invalid email: Received"),
          field: "fromEmail",
        },
        {
          message: expect.stringMatching("Invalid email: Received"),
          field: "replyToEmail",
        },
      ],
    })
  })

  test("can update individual fields of a broadcast", async ({ expect }) => {
    await refreshDatabase()
    const { user, audience } = await createUser()
    const database = makeDatabase()
    const broadcastId = await createBroadcastForUser(user, audience.id)

    const updateData = {
      subject: faker.lorem.sentence(),
    }

    const response = await makeRequestAsUser(user, {
      method: "PUT",
      path: `/broadcasts/${broadcastId}`,
      body: updateData,
    })

    expect(response.status).toBe(200)

    const updatedBroadcast = await database.query.broadcasts.findFirst({
      where: eq(broadcasts.id, broadcastId),
    })

    expect(updatedBroadcast?.subject).toBe(updateData.subject)
    expect(updatedBroadcast?.name).toBeDefined() // Other fields should remain unchanged
  })

  test("cannot update a non-existent broadcast", async ({ expect }) => {
    await refreshDatabase()
    const { user } = await createUser()

    const response = await makeRequestAsUser(user, {
      method: "PUT",
      path: `/broadcasts/${faker.string.uuid()}`,
      body: {
        name: faker.lorem.words(3),
      },
    })

    expect(response.status).toBe(422)
    expect(await response.json()).toMatchObject({
      errors: [{ message: "Unknown broadcast.", field: "id" }],
    })
  })

  test("can update sendAt to a valid timestamp", async ({ expect }) => {
    await refreshDatabase()
    const { user, audience } = await createUser()
    const database = makeDatabase()
    const broadcastId = await createBroadcastForUser(user, audience.id)

    const sendAt = new Date(Date.now() + 86400000) // 24 hours from now

    const response = await makeRequestAsUser(user, {
      method: "PUT",
      path: `/broadcasts/${broadcastId}`,
      body: {
        sendAt,
      },
    })

    expect(response.status).toBe(200)

    const updatedBroadcast = await database.query.broadcasts.findFirst({
      where: eq(broadcasts.id, broadcastId),
    })

    expect(updatedBroadcast?.sendAt?.getDate()).toBe(sendAt.getDate())
  })

  test("cannot update sendAt to a past timestamp", async ({ expect }) => {
    await refreshDatabase()
    const { user, audience } = await createUser()
    const broadcastId = await createBroadcastForUser(user, audience.id)

    const sendAt = new Date(Date.now() - 86400000) // 24 hours ago

    const response = await makeRequestAsUser(user, {
      method: "PUT",
      path: `/broadcasts/${broadcastId}`,
      body: {
        sendAt,
      },
    })

    expect(response.status).toBe(422)
    expect(await response.json()).toMatchObject({
      errors: [{ message: "sendAt cannot be in the past.", field: "sendAt" }],
    })
  })
})

describe("Delete broadcasts", () => {
  test("cannot delete a broadcast from another team", async ({ expect }) => {
    await refreshDatabase()

    const { user: user1, audience: audience1 } = await createUser()
    const { user: user2 } = await createUser()

    const broadcastId = await createBroadcastForUser(user1, audience1.id)

    const response = await makeRequestAsUser(user2, {
      method: "DELETE",
      path: `/broadcasts/${broadcastId}`,
    })

    expect(response.status).toBe(401)

    const database = makeDatabase()

    const broadcast = await database.query.broadcasts.findFirst({
      where: eq(broadcasts.id, broadcastId),
    })
    expect(broadcast).toBeDefined()
  })

  test("can delete a broadcast", async ({ expect }) => {
    await refreshDatabase()
    const { user, audience } = await createUser()

    const broadcastId = await createBroadcastForUser(user, audience.id)

    const response = await makeRequestAsUser(user, {
      method: "DELETE",
      path: `/broadcasts/${broadcastId}`,
    })

    expect(response.status).toBe(200)

    const database = makeDatabase()
    const broadcast = await database.query.broadcasts.findFirst({
      where: eq(broadcasts.id, broadcastId),
    })
    expect(broadcast).toBeUndefined()
  })
})

describe("Send Broadcast", () => {
  test("can queue a broadcast for sending", async ({ expect }) => {
    await refreshDatabase()
    const { user, audience } = await createUser()

    const database = makeDatabase()

    const broadcastId = await createBroadcastForUser(user, audience.id)

    const response = await makeRequestAsUser(user, {
      method: "POST",
      path: `/broadcasts/${broadcastId}/send`,
    })

    expect(response.status).toBe(200)
    const queuedJob = await database.query.queueJobs.findFirst({})

    expect(queuedJob?.jobId).toBe("BROADCASTS::SEND_BROADCAST")
  })
})
