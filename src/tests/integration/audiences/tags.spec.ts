import { faker } from "@faker-js/faker"
import { eq } from "drizzle-orm"
import { describe, test } from "vitest"

import { createUser } from "@/tests/mocks/auth/users.js"
import { refreshDatabase } from "@/tests/mocks/teams/teams.js"
import { makeRequestAsUser } from "@/tests/utils/http.js"

import { tags, tagsOnContacts } from "@/database/schema/schema.js"

import { makeDatabase } from "@/shared/container/index.js"

describe("@tags create", () => {
  test("can create a tag into the database", async ({ expect }) => {
    await refreshDatabase()

    const { user, audience } = await createUser()
    const payload = { name: faker.lorem.word() }

    // Act
    const response = await makeRequestAsUser(user, {
      method: "POST",
      path: `/audiences/${audience.id}/tags`,
      body: payload,
    })

    // Assert
    expect(response.status).toBe(201)
    const database = makeDatabase()
    const savedTag = await database.query.tags.findFirst({
      where: eq(tags.name, payload.name),
    })
    expect(savedTag).toBeDefined()
    expect(savedTag?.audienceId).toBe(audience.id)
  })

  test("cannot create a tag without a valid name", async ({ expect }) => {
    // Arrange
    // await refreshDatabase()
    const { user, audience } = await createUser()
    const payload = { name: "" }

    // Act
    const response = await makeRequestAsUser(user, {
      method: "POST",
      path: `/audiences/${audience.id}/tags`,
      body: payload,
    })
    const json = await response.json()

    // Assert
    expect(response.status).toBe(422)
    expect(json.errors).toContainEqual(
      expect.objectContaining({ field: "name" }),
    )
  })

  test("cannot create a tag without the right team permissions", async ({
    expect,
  }) => {
    // Arrange
    await refreshDatabase()
    const { user, audience } = await createUser()
    const { user: otherUser } = await createUser()
    const payload = { name: faker.lorem.word() }

    // Act
    const response = await makeRequestAsUser(otherUser, {
      method: "POST",
      path: `/audiences/${audience.id}/tags`,
      body: payload,
    })

    const json = await response.json()

    // Assert
    expect(response.status).toBe(401)
    expect(json.message).toBe(
      "Unauthorized: This audience does not belong to your team.",
    )
  })

  test("cannot create a tag if the audience ID is invalid or does not exist", async ({
    expect,
  }) => {
    // Arrange
    await refreshDatabase()
    const { user } = await createUser()
    const payload = { name: faker.lorem.word() }
    const invalidAudienceId = faker.string.uuid()

    // Act
    const response = await makeRequestAsUser(user, {
      method: "POST",
      path: `/audiences/${invalidAudienceId}/tags`,
      body: payload,
    })

    // Assert
    expect(response.status).toBe(422)
    const json = await response.json()
    expect(json.errors).toContainEqual(
      expect.objectContaining({ field: "audienceId" }),
    )
  })

  test("cannot create a tag in which the name already exists", async ({
    expect,
  }) => {
    // Arrange
    await refreshDatabase()
    const { user, audience } = await createUser()
    const tagName = faker.lorem.word()
    const database = makeDatabase()

    await database.insert(tags).values({
      name: tagName,
      audienceId: audience.id,
    })

    // Act
    const response = await makeRequestAsUser(user, {
      method: "POST",
      path: `/audiences/${audience.id}/tags`,
      body: { name: tagName },
    })

    // Assert
    expect(response.status).toBe(422)
    const json = await response.json()
    expect(json.errors).toContainEqual(
      expect.objectContaining({ field: "name" }),
    )
  })
})

describe("@tags delete", () => {
  test("can delete a tag that exists", async ({ expect }) => {
    // Arrange
    await refreshDatabase()
    const { user, audience } = await createUser()
    const tagName = faker.lorem.word()

    const createResponse = await makeRequestAsUser(user, {
      method: "POST",
      path: `/audiences/${audience.id}/tags`,
      body: { name: tagName },
    })
    const { id: tagId } = await createResponse.json()

    // Act
    const deleteResponse = await makeRequestAsUser(user, {
      method: "DELETE",
      path: `/audiences/${audience.id}/tags/${tagId}`,
    })

    // Assert
    expect(deleteResponse.status).toBe(200)

    const database = makeDatabase()

    const deletedTag = await database.query.tags.findFirst({
      where: eq(tags.id, tagId),
    })
    expect(deletedTag).toBeUndefined()
  })

  test("cannot delete a tag without the proper authorization", async ({
    expect,
  }) => {
    // Arrange
    await refreshDatabase()
    const { user, audience } = await createUser()
    const { user: otherUser } = await createUser()

    const tagName = faker.lorem.word()

    const createResponse = await makeRequestAsUser(user, {
      method: "POST",
      path: `/audiences/${audience.id}/tags`,
      body: { name: tagName },
    })

    const { id: tagId } = await createResponse.json()

    const database = makeDatabase()

    // Act
    const deleteResponse = await makeRequestAsUser(otherUser, {
      method: "DELETE",
      path: `/audiences/${audience.id}/tags/${tagId}`,
    })

    // Assert
    expect(deleteResponse.status).toBe(401)

    const tag = await database.query.tags.findFirst({
      where: eq(tags.id, tagId),
    })

    expect(tag).toBeDefined()
  })
})

describe("@tags attach to contacts", () => {
  test("can attach 5 tags to a contact in an audience", async ({
    expect,
  }) => {
    // Arrange
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

    // Create 5 tags
    const tagIds = []
    for (let i = 0; i < 5; i++) {
      const createTagResponse = await makeRequestAsUser(user, {
        method: "POST",
        path: `/audiences/${audience.id}/tags`,
        body: { name: faker.lorem.word() },
      })
      const { id } = await createTagResponse.json()
      tagIds.push(id)
    }

    // Act
    const response = await makeRequestAsUser(user, {
      method: "POST",
      path: `/audiences/${audience.id}/contacts/${contactId}/tags/attach`,
      body: { tags: tagIds },
    })

    // Assert
    expect(response.status).toBe(200)
    const attachedTags = await database.query.tagsOnContacts.findMany({
      where: eq(tagsOnContacts.contactId, contactId),
    })
    expect(attachedTags).toHaveLength(5)
    expect(attachedTags.map((t) => t.tagId)).toEqual(
      expect.arrayContaining(tagIds),
    )
  })

  test("can only attach valid tags", async ({ expect }) => {
    // Arrange
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

    // Create 2 valid tags
    const validTagIds = []
    for (let i = 0; i < 2; i++) {
      const createTagResponse = await makeRequestAsUser(user, {
        method: "POST",
        path: `/audiences/${audience.id}/tags`,
        body: { name: faker.lorem.word() },
      })
      const { id } = await createTagResponse.json()
      validTagIds.push(id)
    }

    // Add an invalid tag ID
    const invalidTagId = faker.string.uuid()
    const tagIds = [...validTagIds, invalidTagId]

    // Act
    const response = await makeRequestAsUser(user, {
      method: "POST",
      path: `/audiences/${audience.id}/contacts/${contactId}/tags/attach`,
      body: { tags: tagIds },
    })

    // Assert
    expect(response.status).toBe(422)
    const json = await response.json()

    expect(json.errors).toContainEqual(
      expect.objectContaining({
        message: expect.stringContaining(
          "One or more of the provided tag IDs is invalid.",
        ),
      }),
    )

    const attachedTags = await database.query.tagsOnContacts.findMany({
      where: eq(tagsOnContacts.contactId, contactId),
    })
    expect(attachedTags).toHaveLength(0)
  })

  test("only authorized users can attach tags to a contact", async ({
    expect,
  }) => {
    await refreshDatabase()
    const { user, audience } = await createUser()
    const { user: unauthorizedUser } = await createUser()

    // Create a contact
    const createContactResponse = await makeRequestAsUser(user, {
      method: "POST",
      path: `/audiences/${audience.id}/contacts`,
      body: { email: faker.internet.email() },
    })
    const { id: contactId } = await createContactResponse.json()

    // Create a tag
    const createTagResponse = await makeRequestAsUser(user, {
      method: "POST",
      path: `/audiences/${audience.id}/tags`,
      body: { name: faker.lorem.word() },
    })
    const { id: tagId } = await createTagResponse.json()

    // Attempt to attach tag as unauthorized user
    const attachResponse = await makeRequestAsUser(unauthorizedUser, {
      method: "POST",
      path: `/audiences/${audience.id}/contacts/${contactId}/tags/attach`,
      body: { tagIds: [tagId] },
    })

    expect(attachResponse.status).toBe(401)
  })
})

describe("@tags detach from contacts", () => {
  test("can detach a list of tags from a contact", async ({ expect }) => {
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

    // Create and attach 5 tags
    const tagIds = []
    for (let i = 0; i < 5; i++) {
      const createTagResponse = await makeRequestAsUser(user, {
        method: "POST",
        path: `/audiences/${audience.id}/tags`,
        body: { name: faker.lorem.word() },
      })
      const { id } = await createTagResponse.json()
      tagIds.push(id)
    }
    await makeRequestAsUser(user, {
      method: "POST",
      path: `/audiences/${audience.id}/contacts/${contactId}/tags/attach`,
      body: { tags: tagIds },
    })

    // Detach 2 tags
    const tagsToDetach = tagIds.slice(0, 2)
    const detachResponse = await makeRequestAsUser(user, {
      method: "POST",
      path: `/audiences/${audience.id}/contacts/${contactId}/tags/detach`,
      body: { tagIds: tagsToDetach },
    })

    expect(detachResponse.status).toBe(200)

    const attachedTags = await database.query.tagsOnContacts.findMany({
      where: eq(tagsOnContacts.contactId, contactId),
    })
    expect(attachedTags).toHaveLength(3)
    expect(attachedTags.map((t) => t.tagId)).not.toEqual(
      expect.arrayContaining(tagsToDetach),
    )
  })

  test("can detach only tags that are already attached to a contact", async ({
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

    // Create and attach 3 tags
    const attachedTagIds = []
    for (let i = 0; i < 3; i++) {
      const createTagResponse = await makeRequestAsUser(user, {
        method: "POST",
        path: `/audiences/${audience.id}/tags`,
        body: { name: faker.lorem.word() },
      })
      const { id } = await createTagResponse.json()
      attachedTagIds.push(id)
    }
    await makeRequestAsUser(user, {
      method: "POST",
      path: `/audiences/${audience.id}/contacts/${contactId}/tags/attach`,
      body: { tagIds: attachedTagIds },
    })

    // Create 2 more tags but don't attach them
    const unattachedTagIds = []
    for (let i = 0; i < 2; i++) {
      const createTagResponse = await makeRequestAsUser(user, {
        method: "POST",
        path: `/audiences/${audience.id}/tags`,
        body: { name: faker.lorem.word() },
      })
      const { id } = await createTagResponse.json()
      unattachedTagIds.push(id)
    }

    // Try to detach all tags (attached and unattached)
    const detachResponse = await makeRequestAsUser(user, {
      method: "POST",
      path: `/audiences/${audience.id}/contacts/${contactId}/tags/detach`,
      body: {
        tagIds: [...attachedTagIds, ...unattachedTagIds],
      },
    })

    expect(detachResponse.status).toBe(200)

    const remainingTags = await database.query.tagsOnContacts.findMany({
      where: eq(tagsOnContacts.contactId, contactId),
    })
    expect(remainingTags).toHaveLength(0)
  })

  test("can only pass valid tags to this endpoint", async ({ expect }) => {
    await refreshDatabase()
    const { user, audience } = await createUser()

    // Create a contact
    const createContactResponse = await makeRequestAsUser(user, {
      method: "POST",
      path: `/audiences/${audience.id}/contacts`,
      body: { email: faker.internet.email() },
    })
    const { id: contactId } = await createContactResponse.json()

    // Try to detach with invalid tag IDs
    const invalidTagIds = [faker.string.uuid(), faker.string.uuid()]

    const detachResponse = await makeRequestAsUser(user, {
      method: "POST",
      path: `/audiences/${audience.id}/contacts/${contactId}/tags/detach`,
      body: { tagIds: invalidTagIds },
    })

    expect(detachResponse.status).toBe(422)
    const json = await detachResponse.json()

    expect(json.errors).toContainEqual(
      expect.objectContaining({
        message: expect.stringContaining(
          "One or more of the provided tag IDs is invalid.",
        ),
      }),
    )
  })

  test("only authorized users can detach tags from a contact", async ({
    expect,
  }) => {
    await refreshDatabase()
    const { user, audience } = await createUser()
    const { user: unauthorizedUser } = await createUser()

    // Create a contact
    const createContactResponse = await makeRequestAsUser(user, {
      method: "POST",
      path: `/audiences/${audience.id}/contacts`,
      body: { email: faker.internet.email() },
    })
    const { id: contactId } = await createContactResponse.json()

    // Create and attach a tag
    const createTagResponse = await makeRequestAsUser(user, {
      method: "POST",
      path: `/audiences/${audience.id}/tags`,
      body: { name: faker.lorem.word() },
    })
    const { id: tagId } = await createTagResponse.json()
    await makeRequestAsUser(user, {
      method: "POST",
      path: `/audiences/${audience.id}/contacts/${contactId}/tags/attach`,
      body: { tagIds: [tagId] },
    })

    // Attempt to detach tag as unauthorized user
    const detachResponse = await makeRequestAsUser(unauthorizedUser, {
      method: "POST",
      path: `/audiences/${audience.id}/contacts/${contactId}/tags/detach`,
      body: { tagIds: [tagId] },
    })

    expect(detachResponse.status).toBe(401)
  })
})
