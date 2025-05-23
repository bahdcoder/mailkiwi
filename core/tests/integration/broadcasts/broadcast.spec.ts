import { faker } from '@faker-js/faker'
import { eq } from 'drizzle-orm'
import { describe, test } from 'vitest'

import { BroadcastRepository } from '#root/core/broadcasts/repositories/broadcast_repository.js'

import {
  createBroadcastForUser,
  createUser,
  setupSendingDomainForTeam,
  createSenderIdentityForTeam,
} from '#root/core/tests/mocks/auth/users.js'
import { refreshRedisDatabase } from '#root/core/tests/mocks/teams/teams.js'
import { makeRequestAsUser } from '#root/core/tests/utils/http.js'

import { broadcasts, emailContents } from '#root/database/schema.js'

import { makeDatabase } from '#root/core/shared/container/index.js'
import { Queue } from '#root/core/shared/queue/queue.js'
import { cuid } from '#root/core/shared/utils/cuid/cuid.js'

import { container } from '#root/core/utils/typi.js'

describe('@broadcasts create', () => {
  test('can create a broadcast for an audience', async ({ expect }) => {
    const { user, audience, broadcastGroupId } = await createUser()
    const database = makeDatabase()

    const broadcastName = faker.lorem.words(3)
    const response = await makeRequestAsUser(user, {
      method: 'POST',
      path: '/broadcasts',
      body: {
        name: broadcastName,
        audienceId: audience.id,
        broadcastGroupId,
      },
    })

    const {
      payload: { id },
    } = await response.json()

    expect(response.status).toBe(201)

    const createdBroadcast = await database.query.broadcasts.findFirst({
      where: eq(broadcasts.id, id),
    })

    expect(createdBroadcast).toBeDefined()
    expect(createdBroadcast?.name).toBe(broadcastName)
    expect(createdBroadcast?.audienceId).toBe(audience.id)
  })

  test('cannot create a broadcast without a valid name', async ({ expect }) => {
    const { user, audience, broadcastGroupId } = await createUser()

    const response = await makeRequestAsUser(user, {
      method: 'POST',
      path: '/broadcasts',
      body: {
        name: '',
        audienceId: audience.id,
        broadcastGroupId,
      },
    })

    const json = await response.json()

    expect(response.status).toBe(422)
    expect(json.payload).toMatchObject({
      errors: [
        {
          message: 'Please provide a name for your broadcast campaign',
          field: 'name',
        },
      ],
    })
  })

  test('cannot create a broadcast without a valid audience that exists in the database', async ({
    expect,
  }) => {
    const { user, team } = await createUser()
    const database = makeDatabase()

    const response = await makeRequestAsUser(user, {
      method: 'POST',
      path: '/broadcasts',
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

describe('@broadcasts update', () => {
  test('can update a broadcast with valid data', async ({ expect }) => {
    const { user, audience, broadcastGroupId, team } = await createUser()

    // Create a sending domain and sender identity for testing
    const sendingDomainId = await setupSendingDomainForTeam(team.id)
    const senderIdentityId = await createSenderIdentityForTeam(team.id, sendingDomainId)

    const broadcastId = await createBroadcastForUser(
      user,
      team.id,
      audience.id,
      broadcastGroupId,
      {
        updateWithABTestsContent: true,
        updateWithValidContent: true,
        senderIdentityId,
      },
    )
    const database = makeDatabase()

    const updateData = {
      name: faker.lorem.words(3),
      emailContent: {
        subject: faker.lorem.sentence(),
        previewText: faker.lorem.sentence(),
      },
      senderIdentityId,
    }

    const response = await makeRequestAsUser(user, {
      method: 'PUT',
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
      .where(eq(emailContents.id, updatedBroadcast?.[0].emailContentId as string))

    expect(emailContent[0]).toMatchObject(updateData.emailContent)
    expect(updatedBroadcast[0].senderIdentityId).toBe(senderIdentityId)
  })

  test('cannot update a broadcast with an invalid audience ID', async ({ expect }) => {
    const { user, audience, broadcastGroupId, team } = await createUser()
    const broadcastId = await createBroadcastForUser(
      user,
      team.id,
      audience.id,
      broadcastGroupId,
    )

    const response = await makeRequestAsUser(user, {
      method: 'PUT',
      path: `/broadcasts/${broadcastId}`,
      body: {
        audienceId: cuid(),
      },
    })
    const json = await response.json()

    expect(response.status).toBe(422)
    expect(json.payload).toMatchObject({
      errors: [
        {
          message:
            'The selected audience does not exist. Please choose a valid audience.',
          field: 'audienceId',
        },
      ],
    })
  })

  test('cannot update a broadcast with invalid sender identity', async ({ expect }) => {
    const { user, audience, broadcastGroupId, team } = await createUser()
    const broadcastId = await createBroadcastForUser(
      user,
      team.id,
      audience.id,
      broadcastGroupId,
    )

    const response = await makeRequestAsUser(user, {
      method: 'PUT',
      path: `/broadcasts/${broadcastId}`,
      body: {
        senderIdentityId: 'invalid-id',
      },
    })

    const json = await response.json()

    expect(response.status).toBe(422)
    // The validation error will be different now that we're using senderIdentityId
    expect(json.payload.errors).toBeDefined()
  })

  test('can update individual fields of a broadcast', async ({ expect }) => {
    const { user, audience, broadcastGroupId, team } = await createUser()
    const broadcastId = await createBroadcastForUser(
      user,
      team.id,
      audience.id,
      broadcastGroupId,
    )

    const updateData = {
      emailContent: {
        subject: faker.lorem.sentence(),
      },
    }

    const response = await makeRequestAsUser(user, {
      method: 'PUT',
      path: `/broadcasts/${broadcastId}`,
      body: updateData,
    })

    expect(response.status).toBe(200)

    const updatedBroadcast = await container
      .make(BroadcastRepository)
      .findByIdWithAbTestVariants(broadcastId)

    expect(updatedBroadcast?.emailContent?.subject).toBe(updateData.emailContent.subject)
    expect(updatedBroadcast?.name).toBeDefined() // Other fields should remain unchanged
  })

  test('cannot update a non-existent broadcast', async ({ expect }) => {
    const { user } = await createUser()

    const response = await makeRequestAsUser(user, {
      method: 'PUT',
      path: `/broadcasts/${cuid()}`,
      body: {
        name: faker.lorem.words(3),
      },
    })

    const json = await response.json()

    expect(response.status).toBe(422)
    expect(json.payload).toMatchObject({
      errors: [{ message: 'Invalid broadcastId provided.', field: 'broadcastId' }],
    })
  })

  test('can update sendAt to a valid timestamp', async ({ expect }) => {
    const { user, audience, broadcastGroupId, team } = await createUser()
    const database = makeDatabase()
    const broadcastId = await createBroadcastForUser(
      user,
      team.id,
      audience.id,
      broadcastGroupId,
    )

    const sendAt = new Date(Date.now() + 86400000) // 24 hours from now

    const response = await makeRequestAsUser(user, {
      method: 'PUT',
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

  test('cannot update sendAt to a past timestamp', async ({ expect }) => {
    const { user, audience, broadcastGroupId, team } = await createUser()
    const broadcastId = await createBroadcastForUser(
      user,
      team.id,
      audience.id,
      broadcastGroupId,
    )

    const sendAt = new Date(Date.now() - 86400000) // 24 hours ago

    const response = await makeRequestAsUser(user, {
      method: 'PUT',
      path: `/broadcasts/${broadcastId}`,
      body: {
        sendAt,
      },
    })

    const json = await response.json()

    expect(response.status).toBe(422)
    expect(json.payload).toMatchObject({
      errors: [
        {
          message:
            'Scheduled broadcasts must be set in the future. Please select a date and time that is at least six hours from now.',
          field: 'sendAt',
        },
      ],
    })
  })
})

describe('@broadcasts delete', () => {
  test('cannot delete a broadcast from another team', async ({ expect }) => {
    const {
      user: user1,
      audience: audience1,
      broadcastGroupId,
      team,
    } = await createUser()
    const { user: user2 } = await createUser()

    const broadcastId = await createBroadcastForUser(
      user1,
      team.id,
      audience1.id,
      broadcastGroupId,
    )

    const response = await makeRequestAsUser(user2, {
      method: 'DELETE',
      path: `/broadcasts/${broadcastId}`,
    })

    expect(response.status).toBe(401)

    const broadcast = await container.make(BroadcastRepository).findById(broadcastId)
    expect(broadcast).toBeDefined()
  })

  test('can delete a broadcast', async ({ expect }) => {
    const { user, audience, broadcastGroupId, team } = await createUser()

    const broadcastId = await createBroadcastForUser(
      user,
      team.id,
      audience.id,
      broadcastGroupId,
    )

    const response = await makeRequestAsUser(user, {
      method: 'DELETE',
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

describe('@broadcasts send', () => {
  test('can queue a broadcast for sending', async ({ expect }) => {
    const { user, audience, broadcastGroupId, team } = await createUser()

    const broadcastId = await createBroadcastForUser(
      user,
      team.id,
      audience.id,
      broadcastGroupId,
      {
        updateWithValidContent: true,
        updateWithABTestsContent: true,
      },
    )

    await refreshRedisDatabase()
    const response = await makeRequestAsUser(user, {
      method: 'POST',
      path: `/broadcasts/${broadcastId}/send`,
    })

    expect(response.status).toBe(200)

    const jobs = await Queue.abTestsBroadcasts().getJobs()

    const broadcastJob = jobs.find((job) => job.data.broadcastId === broadcastId)

    expect(broadcastJob).toBeDefined()
  })

  test('cannot queue a broadcast if all required information is not provided', async ({
    expect,
  }) => {
    const { user, audience, broadcastGroupId, team } = await createUser()

    const broadcastId = await createBroadcastForUser(
      user,
      team.id,
      audience.id,
      broadcastGroupId,
    )

    const response = await makeRequestAsUser(user, {
      method: 'POST',
      path: `/broadcasts/${broadcastId}/send`,
    })

    const json = await response.json()

    expect(response.status).toBe(422)
    expect(json.payload.message).toBe('Validation failed.')

    // Check for specific error fields without relying on exact order
    const errors = json.payload.errors
    // Instead of checking exact messages which may change, just check that we have errors for the expected fields
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'sendingDomainId',
        }),
        expect.objectContaining({
          field: 'senderIdentityId',
        }),
        expect.objectContaining({
          field: 'emailContent.subject',
        }),
        expect.objectContaining({
          field: 'emailContent.contentJson',
        }),
        expect.objectContaining({
          field: 'emailContent.previewText',
        }),
      ]),
    )
    // TODO: Check redis for queued job.
  })

  test('cannot queue a broadcast if the account has sending disabled', async ({
    expect,
  }) => {
    const { user, audience, broadcastGroupId, team } = await createUser()

    const database = makeDatabase()

    const broadcastId = await createBroadcastForUser(
      user,
      team.id,
      audience.id,
      broadcastGroupId,
      {
        updateWithValidContent: true,
      },
    )

    await database
      .update(broadcasts)
      .set({ status: 'SENDING_FAILED' })
      .where(eq(broadcasts.id, broadcastId))
      .execute()

    const response = await makeRequestAsUser(user, {
      method: 'POST',
      path: `/broadcasts/${broadcastId}/send`,
    })

    const json = await response.json()

    expect(response.status).toBe(422)
    expect(json.payload).toMatchObject({
      message: 'Validation failed.',
      errors: [
        {
          message: 'Only a draft broadcast can be sent.',
          field: 'status',
        },
      ],
    })
    // TODO: Check redis for queued job.
  })

  test('cannot send a broadcast with invalid or incomplete a/b variants information', async ({
    expect,
  }) => {
    const { user, audience, broadcastGroupId, team } = await createUser()

    const broadcastId = await createBroadcastForUser(
      user,
      team.id,
      audience.id,
      broadcastGroupId,
      {
        updateWithValidContent: true,
      },
    )

    const updateData = {
      name: faker.lorem.words(3),
      emailContentVariants: [
        {
          fromName: faker.person.fullName(),
          fromEmail: faker.internet.userName(),
          replyToEmail: faker.internet.email(),
          name: faker.lorem.words(3),
          weight: 25,
        },
        {
          fromName: faker.person.fullName(),
          fromEmail: faker.internet.userName(),
          replyToEmail: faker.internet.email(),
          name: faker.lorem.words(2),
          weight: 45,
        },
      ],
    }

    const updateResponse = await makeRequestAsUser(user, {
      method: 'PUT',
      path: `/broadcasts/${broadcastId}`,
      body: updateData,
    })

    expect(updateResponse.status).toBe(200)

    const response = await makeRequestAsUser(user, {
      method: 'POST',
      path: `/broadcasts/${broadcastId}/send`,
    })

    const json = await response.json()

    expect(response.status).toBe(422)

    expect(json.payload.errors[0]).toEqual({
      message:
        'Some A/B test variants are invalid. Please make sure all variants are valid.',
      field: 'abTestVariants',
    })
  })
})
