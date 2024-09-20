import { faker } from "@faker-js/faker"
import { eq } from "drizzle-orm"
import { describe, test } from "vitest"

import { BroadcastRepository } from "@/broadcasts/repositories/broadcast_repository.js"

import {
  createBroadcastForUser,
  createUser,
} from "@/tests/mocks/auth/users.js"
import { makeRequestAsUser } from "@/tests/utils/http.js"

import { broadcasts, emailContents } from "@/database/schema/schema.js"

import { makeDatabase } from "@/shared/container/index.js"

import { container } from "@/utils/typi.js"

describe("@broadcasts create", () => {
  test("can create a broadcast for an audience", async ({ expect }) => {
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

  test("cannot create a broadcast without a valid name", async ({
    expect,
  }) => {
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
    const { user, team } = await createUser()
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

    const broadcastsCount = await database
      .select()
      .from(broadcasts)
      .where(eq(broadcasts.teamId, team.id))

    expect(broadcastsCount).toHaveLength(0)
  })
})

describe("@broadcasts update", () => {
  test("can update a broadcast with valid data", async ({ expect }) => {
    const { user, audience } = await createUser()
    const broadcastId = await createBroadcastForUser(user, audience.id, {
      updateWithABTestsContent: true,
      updateWithValidContent: true,
    })
    const database = makeDatabase()

    const updateData = {
      name: faker.lorem.words(3),
      emailContent: {
        fromName: faker.person.fullName(),
        fromEmail: faker.internet.email(),
        replyToEmail: faker.internet.email(),
        replyToName: faker.person.fullName(),
        subject: faker.lorem.sentence(),
        previewText: faker.lorem.sentence(),
      },
    }

    const response = await makeRequestAsUser(user, {
      method: "PUT",
      path: `/broadcasts/${broadcastId}`,
      body: updateData,
    })

    expect(response.status).toBe(200)

    const updatedBroadcast = await database
      .select()
      .from(broadcasts)
      .where(eq(broadcasts.id, broadcastId))

    const emailContent = await database
      .select()
      .from(emailContents)
      .where(
        eq(
          emailContents.id,
          updatedBroadcast?.[0].emailContentId as number,
        ),
      )

    expect(emailContent[0]).toMatchObject(updateData.emailContent)
  })

  test("cannot update a broadcast with an invalid audience ID", async ({
    expect,
  }) => {
    const { user, audience } = await createUser()
    const broadcastId = await createBroadcastForUser(user, audience.id)

    const response = await makeRequestAsUser(user, {
      method: "PUT",
      path: `/broadcasts/${broadcastId}`,
      body: {
        audienceId: faker.number.int(),
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
    const { user, audience } = await createUser()
    const broadcastId = await createBroadcastForUser(user, audience.id)

    const response = await makeRequestAsUser(user, {
      method: "PUT",
      path: `/broadcasts/${broadcastId}`,
      body: {
        emailContent: {
          fromEmail: "invalid-email",
          replyToEmail: "also-invalid",
        },
      },
    })

    expect(response.status).toBe(422)
    expect(await response.json()).toMatchObject({
      errors: [
        {
          message: expect.stringMatching("Invalid email: Received"),
          field: "emailContent",
        },
        {
          message: expect.stringMatching("Invalid email: Received"),
          field: "emailContent",
        },
      ],
    })
  })

  test("can update individual fields of a broadcast", async ({
    expect,
  }) => {
    const { user, audience } = await createUser()
    const database = makeDatabase()
    const broadcastId = await createBroadcastForUser(user, audience.id)

    const updateData = {
      emailContent: {
        subject: faker.lorem.sentence(),
      },
    }

    const response = await makeRequestAsUser(user, {
      method: "PUT",
      path: `/broadcasts/${broadcastId}`,
      body: updateData,
    })

    expect(response.status).toBe(200)

    const updatedBroadcast = await container
      .make(BroadcastRepository)
      .findByIdWithAbTestVariants(broadcastId)

    expect(updatedBroadcast?.emailContent?.subject).toBe(
      updateData.emailContent.subject,
    )
    expect(updatedBroadcast?.name).toBeDefined() // Other fields should remain unchanged
  })

  test("cannot update a non-existent broadcast", async ({ expect }) => {
    const { user } = await createUser()

    const response = await makeRequestAsUser(user, {
      method: "PUT",
      path: `/broadcasts/${faker.number.int()}`,
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
      errors: [
        {
          message: "sendAt cannot be in the past.",
          field: "sendAt",
        },
      ],
    })
  })
})

describe("@broadcasts delete", () => {
  test("cannot delete a broadcast from another team", async ({
    expect,
  }) => {
    const { user: user1, audience: audience1 } = await createUser()
    const { user: user2 } = await createUser()

    const broadcastId = await createBroadcastForUser(user1, audience1.id)

    const response = await makeRequestAsUser(user2, {
      method: "DELETE",
      path: `/broadcasts/${broadcastId}`,
    })

    expect(response.status).toBe(401)

    const broadcast = await container
      .make(BroadcastRepository)
      .findById(broadcastId)
    expect(broadcast).toBeDefined()
  })

  test("can delete a broadcast", async ({ expect }) => {
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

describe("@broadcasts send", () => {
  test("can queue a broadcast for sending", async ({ expect }) => {
    const { user, audience } = await createUser()

    const broadcastId = await createBroadcastForUser(user, audience.id, {
      updateWithValidContent: true,
      updateWithABTestsContent: true,
    })

    const response = await makeRequestAsUser(user, {
      method: "POST",
      path: `/broadcasts/${broadcastId}/send`,
    })

    expect(response.status).toBe(200)
    // TODO: Check redis for queued job.
  })

  test("cannot queue a broadcast if all required information is not provided", async ({
    expect,
  }) => {
    const { user, audience } = await createUser()

    const broadcastId = await createBroadcastForUser(user, audience.id)

    const response = await makeRequestAsUser(user, {
      method: "POST",
      path: `/broadcasts/${broadcastId}/send`,
    })

    expect(response.status).toBe(422)
    expect(await response.json()).toMatchObject({
      message: "Validation failed.",
      errors: [
        {
          message: "Invalid type: Expected Object but received null",
          field: "emailContent",
        },
      ],
    })
    // TODO: Check redis for queued job.
  })

  test("cannot queue a broadcast if the account has sending disabled", async ({
    expect,
  }) => {
    const { user, audience } = await createUser()

    const database = makeDatabase()

    const broadcastId = await createBroadcastForUser(user, audience.id, {
      updateWithValidContent: true,
    })

    await database
      .update(broadcasts)
      .set({ status: "SENDING_FAILED" })
      .where(eq(broadcasts.id, broadcastId))
      .execute()

    const response = await makeRequestAsUser(user, {
      method: "POST",
      path: `/broadcasts/${broadcastId}/send`,
    })

    expect(response.status).toBe(422)
    expect(await response.json()).toMatchObject({
      message: "Validation failed.",
      errors: [
        {
          message: "Only a draft broadcast can be sent.",
          field: "status",
        },
      ],
    })
    // TODO: Check redis for queued job.
  })

  test("cannot send a broadcast with invalid or incomplete a/b variants information", async ({
    expect,
  }) => {
    const { user, audience, team } = await createUser()

    const broadcastId = await createBroadcastForUser(user, audience.id, {
      updateWithValidContent: true,
    })

    const updateData = {
      name: faker.lorem.words(3),
      emailContentVariants: [
        {
          fromName: faker.person.fullName(),
          fromEmail: faker.internet.email(),
          replyToEmail: faker.internet.email(),
          name: faker.lorem.words(3),
          weight: 25,
        },
        {
          fromName: faker.person.fullName(),
          fromEmail: faker.internet.email(),
          replyToEmail: faker.internet.email(),
          name: faker.lorem.words(2),
          weight: 45,
        },
      ],
    }

    const updateResponse = await makeRequestAsUser(user, {
      method: "PUT",
      path: `/broadcasts/${broadcastId}`,
      body: updateData,
    })

    expect(updateResponse.status).toBe(200)

    const response = await makeRequestAsUser(user, {
      method: "POST",
      path: `/broadcasts/${broadcastId}/send`,
    })

    const json = await response.json()
    expect(response.status).toBe(422)

    expect(json.errors[0]).toEqual({
      message:
        "Some A/B test variants are invalid. Please make sure all variants are valid.",
      field: "abTestVariants",
    })
  })
})
