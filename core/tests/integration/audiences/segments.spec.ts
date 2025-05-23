import { faker } from '@faker-js/faker'
import { eq } from 'drizzle-orm'
import { DateTime } from 'luxon'
import { describe, test } from 'vitest'

import { AllowedFilterFieldPickList } from '#root/core/audiences/dto/segments/create_segment_dto.js'
import { AudienceRepository } from '#root/core/audiences/repositories/audience_repository.js'
import { ContactRepository } from '#root/core/audiences/repositories/contact_repository.js'

import { createFakeContact } from '#root/core/tests/mocks/audiences/contacts.js'
import { createUser } from '#root/core/tests/mocks/auth/users.js'
import { makeRequestAsUser } from '#root/core/tests/utils/http.js'

import {
  type ContactFilterCondition,
  contactProperties,
  contacts,
  segments,
  tags,
} from '#root/database/schema.js'

import { makeDatabase } from '#root/core/shared/container/index.js'
import { cuid } from '#root/core/shared/utils/cuid/cuid.js'

import { container } from '#root/core/utils/typi.js'

describe('@audience segments', () => {
  test('can create an audience segment', async ({ expect }) => {
    const { user, audience } = await createUser()

    const database = makeDatabase()

    const payload = {
      name: faker.lorem.words(3),
      filterGroups: {
        type: 'AND',
        groups: [
          {
            type: 'AND',
            conditions: [
              {
                field: 'email',
                operation: 'endsWith',
                value: '@gmail.com',
              },
            ],
          },
        ],
      },
    }

    const response = await makeRequestAsUser(user, {
      method: 'POST',
      path: `/audiences/${audience.id}/segments`,
      body: payload,
    })

    expect(response.status).toBe(200)

    const savedSegment = await database
      .select()
      .from(segments)
      .where(eq(segments.audienceId, audience.id))
      .limit(1)

    expect(savedSegment).toEqual([
      {
        id: expect.any(String),
        name: payload.name,
        audienceId: audience.id,
        filterGroups: {
          type: 'AND',
          groups: [
            {
              type: 'AND',
              conditions: [
                {
                  field: 'email',
                  operation: 'endsWith',
                  value: '@gmail.com',
                },
              ],
            },
          ],
        },
      },
    ])
  })

  test('cannot create an audience with invalid conditions', async ({ expect }) => {
    const { user, audience } = await createUser()

    const database = makeDatabase()

    const payload = {
      name: faker.lorem.words(3),
      filterGroups: {
        type: 'AND',
        groups: [
          {
            type: 'OR',
            conditions: [
              {
                field: 'fame',
                operation: 'endsWith',
                value: '@gmail.com',
              },
            ],
          },
        ],
      },
    }

    const response = await makeRequestAsUser(user, {
      method: 'POST',
      path: `/audiences/${audience.id}/segments`,
      body: payload,
    })

    const json = await response.json()

    expect(response.status).toBe(422)
    expect(json.payload).toStrictEqual({
      message: 'Validation failed.',
      errors: [
        {
          message:
            'Only the following fields are allowed: email, firstName, lastName, subscribedAt, tags, status, source, lastSentBroadcastEmailAt, lastSentAutomationEmailAt, lastOpenedBroadcastEmailAt, lastOpenedAutomationEmailAt, lastClickedBroadcastEmailLinkAt, lastClickedAutomationEmailLinkAt, lastTrackedActivityFrom, lastTrackedActivityUsingDevice, lastTrackedActivityUsingBrowser, segmentId, properties.*',
          field: 'filterGroups.groups.0.conditions.0.field',
        },
      ],
    })

    const savedSegment = await database
      .select()
      .from(segments)
      .where(eq(segments.audienceId, audience.id))

    expect(savedSegment).toHaveLength(0)
  })

  test('can select contacts for a specific segment: email starts with', async ({
    expect,
  }) => {
    const { user, audience } = await createUser()

    const database = makeDatabase()

    const emailStartsWith = faker.string.uuid()

    await database
      .insert(contacts)
      .values(
        faker.helpers
          .multiple(
            () => `${faker.lorem.word()}-${faker.lorem.word()}-${faker.lorem.word()}`,
            { count: 100 },
          )
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

    const segmentId = cuid()

    await database.insert(segments).values({
      id: segmentId,
      audienceId: audience.id,
      name: faker.lorem.words(3),
      filterGroups: {
        type: 'OR',
        groups: [
          {
            type: 'AND',
            conditions: [
              {
                field: 'email',
                operation: 'startsWith',
                value: emailStartsWith,
              },
            ],
          },
        ],
      },
    })

    const response = await makeRequestAsUser(user, {
      method: 'GET',
      path: `/audiences/${audience.id}/contacts?segmentId=${segmentId}&page=1&perPage=50`,
    })

    const json = await response.json()

    expect(json.total).toBe(countForSegment)
    expect(json.data).toHaveLength(countForSegment)
  })

  test('can select contacts for a specific segment: contact has one of tags', async ({
    expect,
  }) => {
    const database = makeDatabase()

    const { user, audience } = await createUser()

    await database
      .insert(contacts)
      .values(
        faker.helpers
          .multiple(faker.lorem.word, { count: 100 })
          .map(() => createFakeContact(audience.id)),
      )

    const tagIds = faker.helpers.multiple(cuid, {
      count: 3,
    })

    await database.insert(tags).values(
      faker.helpers.multiple(faker.string.uuid, { count: 10 }).map((name, idx) => ({
        id: tagIds[idx],
        name,
        audienceId: audience.id,
      })),
    )

    const countForSegment = faker.number.int({
      min: 8,
      max: 17,
    })

    const segmentContactIds = faker.helpers.multiple(cuid, {
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

    const segmentId = cuid()

    await database.insert(segments).values({
      id: segmentId,
      audienceId: audience.id,
      name: faker.lorem.words(3),
      filterGroups: {
        type: 'AND',
        groups: [
          {
            type: 'AND',
            conditions: [
              {
                field: 'tags',
                operation: 'contains',
                value: [tagIds[0], tagIds[1]],
              },
            ],
          },
        ],
      },
    })

    const response = await makeRequestAsUser(user, {
      method: 'GET',
      path: `/audiences/${audience.id}/contacts?segmentId=${segmentId}&page=1&perPage=50`,
    })

    const json = await response.json()

    expect(json.total).toBe(countForSegment)
    expect(json.data).toHaveLength(countForSegment)
  })

  test('can select contacts for a specific segment: contact has none of tags', async ({
    expect,
  }) => {
    const database = makeDatabase()

    const { user, audience } = await createUser()

    const countForNonSegment = faker.number.int({
      min: 10,
      max: 40,
    })

    await database.insert(contacts).values(
      faker.helpers
        .multiple(
          () => `${faker.lorem.word()}-${faker.lorem.word()}-${faker.lorem.word()}`,
          {
            count: countForNonSegment,
          },
        )
        .map(() => createFakeContact(audience.id)),
    )

    const tagIds = faker.helpers.multiple(cuid, {
      count: 3,
    })

    await database.insert(tags).values(
      faker.helpers
        .multiple(
          () => `${faker.lorem.word()}-${faker.lorem.word()}-${faker.lorem.word()}`,
          { count: 10 },
        )
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

    const segmentContactIds = faker.helpers.multiple(cuid, {
      count: countForSegment,
    })

    await database.insert(contacts).values(
      faker.helpers
        .multiple(
          () => `${faker.lorem.word()}-${faker.lorem.word()}-${faker.lorem.word()}`,
          {
            count: countForSegment,
          },
        )
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

    const segmentId = cuid()

    await database.insert(segments).values({
      id: segmentId,
      audienceId: audience.id,
      name: faker.lorem.words(3),
      filterGroups: {
        type: 'AND',
        groups: [
          {
            type: 'AND',
            conditions: [
              {
                field: 'tags',
                operation: 'notContains',
                value: [tagIds[0], tagIds[1]],
              },
            ],
          },
        ],
      },
    })

    const response = await makeRequestAsUser(user, {
      method: 'GET',
      path: `/audiences/${audience.id}/contacts?segmentId=${segmentId}&page=1&perPage=100`,
    })

    const json = await response.json()

    expect(json.total).toBe(countForNonSegment)
    expect(json.data).toHaveLength(countForNonSegment)
  })

  test('can select contacts for a specific segment: contact last clicked on a broadcast within the past 3 months', async ({
    expect,
  }) => {
    const database = makeDatabase()

    const { user, audience } = await createUser()

    const countForNonSegment = faker.number.int({
      min: 100,
      max: 400,
    })

    await database.insert(contacts).values(
      faker.helpers
        .multiple(
          () => `${faker.lorem.word()}-${faker.lorem.word()}-${faker.lorem.word()}`,
          {
            count: countForNonSegment,
          },
        )
        .map(() => createFakeContact(audience.id)),
    )

    const countForSegment = faker.number.int({
      min: 800,
      max: 1700,
    })

    const segmentContactIds = faker.helpers.multiple(cuid, {
      count: countForSegment,
    })

    await database.insert(contacts).values(
      faker.helpers
        .multiple(
          () => `${faker.lorem.word()}-${faker.lorem.word()}-${faker.lorem.word()}`,
          {
            count: countForSegment,
          },
        )
        .map((_, idx) =>
          createFakeContact(audience.id, {
            id: segmentContactIds[idx],
            lastClickedBroadcastEmailLinkAt: DateTime.now()
              .minus({ days: 55 })
              .toJSDate(),
          }),
        ),
    )

    const segmentId = cuid()

    await database.insert(segments).values({
      id: segmentId,
      audienceId: audience.id,
      name: faker.lorem.words(3),
      filterGroups: {
        type: 'AND',
        groups: [
          {
            type: 'AND',
            conditions: [
              {
                field: 'lastClickedBroadcastEmailLinkAt',
                operation: 'inTimeWindow',
                value: 'last_90_days',
              },
            ],
          },
        ],
      },
    })

    const perPage = 500

    const response = await makeRequestAsUser(user, {
      method: 'GET',
      path: `/audiences/${audience.id}/contacts?segmentId=${segmentId}&page=1&perPage=${perPage}`,
    })

    const json = await response.json()

    expect(json.total).toBe(countForSegment)
    expect(json.data).toHaveLength(perPage)
  })
  test('can select contacts for a specific segment: filter by queries on property value', async ({
    expect,
  }) => {
    const database = makeDatabase()

    const { user, audience } = await createUser()

    const countForNonSegment = faker.number.int({
      min: 100,
      max: 400,
    })

    await database.insert(contacts).values(
      faker.helpers
        .multiple(
          () => `${faker.lorem.word()}-${faker.lorem.word()}-${faker.lorem.word()}`,
          {
            count: countForNonSegment,
          },
        )
        .map(() => createFakeContact(audience.id)),
    )

    const countForSegment = faker.number.int({
      min: 800,
      max: 1700,
    })

    const segmentContactIds = faker.helpers.multiple(cuid, {
      count: countForSegment,
    })

    await database.insert(contacts).values(
      faker.helpers
        .multiple(
          () => `${faker.lorem.word()}-${faker.lorem.word()}-${faker.lorem.word()}`,
          {
            count: countForSegment,
          },
        )
        .map((_, idx) =>
          createFakeContact(audience.id, {
            id: segmentContactIds[idx],
            lastClickedBroadcastEmailLinkAt: DateTime.now()
              .minus({ days: 55 })
              .toJSDate(),
          }),
        ),
    )

    const countForSegmentProperties = 125

    await container.make(AudienceRepository).updateKnownProperties(audience.id, [
      {
        id: 'age',
        type: 'float',
        label: 'Age',
      },
      {
        id: 'favoriteColor',
        type: 'text',
        label: 'Favorite color',
      },
    ])

    await database.insert(contactProperties).values(
      faker.helpers
        .multiple(() => ({}), { count: countForSegmentProperties })
        .map((_, idx) => ({
          id: cuid(),
          name: 'age',
          contactId: segmentContactIds[idx],
          float: 26,
          audienceId: audience.id,
        })),
    )

    await database.insert(contactProperties).values(
      faker.helpers
        .multiple(() => ({}), { count: countForSegmentProperties })
        .map((_, idx) => ({
          id: cuid(),
          name: 'favoriteColor',
          contactId: segmentContactIds[idx],
          text: faker.lorem.words(3),
          audienceId: audience.id,
        })),
    )

    const segmentId = cuid()

    await database.insert(segments).values({
      id: segmentId,
      audienceId: audience.id,
      name: faker.lorem.words(3),
      filterGroups: {
        type: 'AND',
        groups: [
          {
            type: 'AND',
            conditions: [
              {
                field: 'properties.age' as unknown as ContactFilterCondition['field'],
                operation: 'gte',
                value: '25',
              },
            ],
          },
        ],
      },
    })

    const perPage = 1

    const response = await makeRequestAsUser(user, {
      method: 'GET',
      path: `/audiences/${audience.id}/contacts?segmentId=${segmentId}&page=1&perPage=${perPage}`,
    })

    const json = await response.json()

    expect(json.total).toBe(countForSegmentProperties)

    expect(json.data?.[0]?.properties?.[0]?.float).toBe(26)
  })
})
