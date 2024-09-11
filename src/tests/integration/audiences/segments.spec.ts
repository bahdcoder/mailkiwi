import { faker } from "@faker-js/faker"
import { eq, lt } from "drizzle-orm"
import { describe, test } from "vitest"

import { ContactRepository } from "@/audiences/repositories/contact_repository.ts"

import { createFakeContact } from "@/tests/mocks/audiences/contacts.ts"
import { createUser } from "@/tests/mocks/auth/users.js"
import { refreshDatabase } from "@/tests/mocks/teams/teams.ts"
import { makeRequestAsUser } from "@/tests/utils/http.ts"

import {
  contacts,
  emails,
  segments,
  tags,
  tagsOnContacts,
} from "@/database/schema/schema.ts"

import { makeDatabase } from "@/shared/container/index.js"
import { cuid } from "@/shared/utils/cuid/cuid.ts"

import { container } from "@/utils/typi.ts"

describe("Audience segments", () => {
  test("can create an audience segment", async ({ expect }) => {
    await refreshDatabase()
    const { user, audience } = await createUser()

    const database = makeDatabase()

    const payload = {
      name: faker.lorem.words(3),
      conditions: [
        {
          field: "email",
          operation: "endsWith",
          value: "@gmail.com",
        },
      ],
    }

    const response = await makeRequestAsUser(user, {
      method: "POST",
      path: `/audiences/${audience.id}/segments`,
      body: payload,
    })

    expect(response.status).toBe(200)

    const savedSegment = await database.query.segments.findMany({})

    expect(savedSegment).toEqual([
      {
        id: expect.any(String),
        name: payload.name,
        audienceId: audience.id,
        conditions: [
          {
            field: "email",
            value: "@gmail.com",
            operation: "endsWith",
          },
        ],
      },
    ])
  })

  test("cannot create an audience with invalid conditions", async ({
    expect,
  }) => {
    await refreshDatabase()
    const { user, audience } = await createUser()

    const database = makeDatabase()

    const payload = {
      name: faker.lorem.words(3),
      conditions: [
        {
          field: "fame",
          operation: "endsWith",
          value: "@gmail.com",
        },
      ],
    }

    const response = await makeRequestAsUser(user, {
      method: "POST",
      path: `/audiences/${audience.id}/segments`,
      body: payload,
    })

    expect(response.status).toBe(422)
    expect(await response.json()).toStrictEqual({
      message: "Validation failed.",
      errors: [
        {
          message:
            'Invalid type: Expected "email" | "firstName" | "lastName" | "subscribedAt" | "tags" but received "fame"',
          field: "conditions",
        },
      ],
    })

    const savedSegment = await database.query.segments.findMany({})

    expect(savedSegment).toHaveLength(0)
  })

  test("can select contacts for a specific segment: email starts with", async ({
    expect,
  }) => {
    await refreshDatabase()
    const { user, audience } = await createUser()

    const database = makeDatabase()

    const emailStartsWith = faker.string.uuid()

    await database
      .insert(contacts)
      .values(
        faker.helpers
          .multiple(faker.lorem.word, { count: 100 })
          .map(() => createFakeContact(audience.id)),
      )

    const countForSegment = faker.number.int({
      min: 7,
      max: 36,
    })

    await database.insert(contacts).values(
      faker.helpers
        .multiple(faker.lorem.word, {
          count: countForSegment,
        })
        .map(() =>
          createFakeContact(audience.id, {
            email: emailStartsWith + faker.internet.email(),
          }),
        ),
    )

    const segmentId = faker.number.int()

    await database.insert(segments).values({
      id: segmentId,
      audienceId: audience.id,
      name: faker.lorem.words(3),
      conditions: [
        {
          field: "email",
          operation: "startsWith",
          value: emailStartsWith,
        },
      ],
    })

    const response = await makeRequestAsUser(user, {
      method: "GET",
      path: `/audiences/${audience.id}/contacts?segmentId=${segmentId}&page=1&perPage=50`,
    })

    const json = await response.json()

    expect(json.total).toBe(countForSegment)
    expect(json.data).toHaveLength(countForSegment)
  })

  test("can select contacts for a specific segment: contact has one of tags", async ({
    expect,
  }) => {
    const database = makeDatabase()

    await refreshDatabase()
    const { user, audience } = await createUser()

    await database
      .insert(contacts)
      .values(
        faker.helpers
          .multiple(faker.lorem.word, { count: 100 })
          .map(() => createFakeContact(audience.id)),
      )

    const tagIds = faker.helpers.multiple(faker.number.int, {
      count: 3,
    })

    await database.insert(tags).values(
      faker.helpers
        .multiple(faker.lorem.word, { count: 10 })
        .map((name, idx) => ({
          id: tagIds[idx],
          name,
          audienceId: audience.id,
        })),
    )

    const countForSegment = faker.number.int({
      min: 8,
      max: 17,
    })

    const segmentContactIds = faker.helpers.multiple(faker.number.int, {
      count: countForSegment,
    })

    await database.insert(contacts).values(
      faker.helpers
        .multiple(faker.lorem.word, {
          count: countForSegment,
        })
        .map((_, idx) =>
          createFakeContact(audience.id, {
            id: segmentContactIds[idx],
          }),
        ),
    )

    for (const contactId of segmentContactIds) {
      await container.make(ContactRepository).attachTags(contactId, tagIds)
    }

    const segmentId = faker.number.int()

    await database.insert(segments).values({
      id: segmentId,
      audienceId: audience.id,
      name: faker.lorem.words(3),
      conditions: [
        {
          field: "tags",
          operation: "contains",
          value: [tagIds[0], tagIds[1]],
        },
      ],
    })

    const response = await makeRequestAsUser(user, {
      method: "GET",
      path: `/audiences/${audience.id}/contacts?segmentId=${segmentId}&page=1&perPage=50`,
    })

    const json = await response.json()

    expect(json.total).toBe(countForSegment)
    expect(json.data).toHaveLength(countForSegment)
  })

  test("can select contacts for a specific segment: contact has none of tags", async ({
    expect,
  }) => {
    const database = makeDatabase()

    await refreshDatabase()
    const { user, audience } = await createUser()

    const countForNonSegment = faker.number.int({
      min: 10,
      max: 40,
    })

    await database.insert(contacts).values(
      faker.helpers
        .multiple(faker.lorem.word, {
          count: countForNonSegment,
        })
        .map(() => createFakeContact(audience.id)),
    )

    const tagIds = faker.helpers.multiple(faker.number.int, {
      count: 3,
    })

    await database.insert(tags).values(
      faker.helpers
        .multiple(faker.lorem.word, { count: 10 })
        .map((name, idx) => ({
          id: tagIds[idx],
          name,
          audienceId: audience.id,
        })),
    )

    const countForSegment = faker.number.int({
      min: 8,
      max: 17,
    })

    const segmentContactIds = faker.helpers.multiple(faker.number.int, {
      count: countForSegment,
    })

    await database.insert(contacts).values(
      faker.helpers
        .multiple(faker.lorem.word, {
          count: countForSegment,
        })
        .map((_, idx) =>
          createFakeContact(audience.id, {
            id: segmentContactIds[idx],
          }),
        ),
    )

    for (const contactId of segmentContactIds) {
      await container.make(ContactRepository).attachTags(contactId, tagIds)
    }

    for (const contactId of segmentContactIds) {
      await container.make(ContactRepository).attachTags(contactId, tagIds)
    }

    const segmentId = faker.number.int()

    await database.insert(segments).values({
      id: segmentId,
      audienceId: audience.id,
      name: faker.lorem.words(3),
      conditions: [
        {
          field: "tags",
          operation: "notContains",
          value: [tagIds[0], tagIds[1]],
        },
      ],
    })

    const response = await makeRequestAsUser(user, {
      method: "GET",
      path: `/audiences/${audience.id}/contacts?segmentId=${segmentId}&page=1&perPage=100`,
    })

    const json = await response.json()

    expect(json.total).toBe(countForNonSegment)
    expect(json.data).toHaveLength(countForNonSegment)
  })
})
