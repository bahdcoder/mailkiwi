import { faker } from '@faker-js/faker'
import { asc, eq } from 'drizzle-orm'
import { describe, test } from 'vitest'

import { BroadcastRepository } from '@/broadcasts/repositories/broadcast_repository.js'

import {
  createFakeAbTestEmailContent,
  createFakeEmailContent,
} from '@/tests/mocks/audiences/email_content.js'
import { createBroadcastForUser, createUser } from '@/tests/mocks/auth/users.js'
import { makeRequestAsUser } from '@/tests/utils/http.js'

import { container } from '@/utils/typi.js'

describe('@broadcasts update broadcasts', () => {
  test('can update a broadcast with ab test variants', async ({ expect }) => {
    const { user, audience, broadcastGroupId, team } = await createUser()
    const broadcastId = await createBroadcastForUser(
      user,
      team.id,
      audience.id,
      broadcastGroupId,
    )

    const abTestVariantsMock = [
      createFakeAbTestEmailContent({ weight: 10 }),
      createFakeAbTestEmailContent({ weight: 30 }),
      createFakeAbTestEmailContent({ weight: 50 }),
    ]

    const updateData = {
      name: faker.lorem.words(3),
      emailContent: createFakeEmailContent(),
      emailContentVariants: abTestVariantsMock,
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

    expect(updatedBroadcast?.isAbTest).toBe(true)

    const variantsEmailContent = updatedBroadcast?.abTestVariants.map(
      ({ name, weight, emailContent: { subject, contentHtml, contentText } }) => ({
        name,
        weight,
        subject,
        contentHtml,
        contentText,
      }),
    )

    const orderedEmailContent = variantsEmailContent?.sort(
      (A, B) => (A.weight as number) - (B.weight as number),
    )

    expect(
      orderedEmailContent?.map((email) => ({
        name: email.name,
        weight: email.weight,
      })),
    ).toStrictEqual(
      abTestVariantsMock.map((email) => ({
        name: email.name,
        weight: email.weight,
      })),
    )
  })

  test('cannot update ab test variants if weights sum up to more than 100', async ({
    expect,
  }) => {
    const { user, audience, broadcastGroupId, team } = await createUser()
    const broadcastId = await createBroadcastForUser(
      user,
      team.id,
      audience.id,
      broadcastGroupId,
    )

    const abTestVariantsMock = [
      createFakeAbTestEmailContent({ weight: 10 }),
      createFakeAbTestEmailContent({ weight: 30 }),
      createFakeAbTestEmailContent({ weight: 75 }),
    ]

    const updateData = {
      name: faker.lorem.words(3),
      emailContent: createFakeEmailContent(),
      emailContentVariants: abTestVariantsMock,
    }

    const response = await makeRequestAsUser(user, {
      method: 'PUT',
      path: `/broadcasts/${broadcastId}`,
      body: updateData,
    })

    const json = await response.json()

    expect(response.status).toBe(422)
    expect(json.payload).toMatchObject({
      message: 'Validation failed.',
      errors: [
        {
          message: 'The sum of all ab test variant weights must be less than 100.',
        },
      ],
    })

    const updatedBroadcast = await container
      .make(BroadcastRepository)
      .findById(broadcastId)

    expect(updatedBroadcast?.isAbTest).toBe(false)
  })
})
