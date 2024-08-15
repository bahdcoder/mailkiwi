import { makeDatabase } from '@/shared/container/index.js'
import { abTestVariants, broadcasts } from '@/database/schema/schema.js'
import { createBroadcastForUser, createUser } from '@/tests/mocks/auth/users.js'
import { refreshDatabase } from '@/tests/mocks/teams/teams.js'
import { makeRequestAsUser } from '@/tests/utils/http.js'
import { faker } from '@faker-js/faker'
import { asc, eq } from 'drizzle-orm'
import { describe, test } from 'vitest'
import {
  createFakeAbTestEmailContent,
  createFakeEmailContent,
} from '@/tests/mocks/audiences/email_content.ts'

describe('Update broadcasts', () => {
  test('can update a broadcast with ab test variants', async ({ expect }) => {
    await refreshDatabase()
    const { user, audience } = await createUser()
    const database = makeDatabase()
    const broadcastId = await createBroadcastForUser(user, audience.id)

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
    const updatedBroadcast = await database.query.broadcasts.findFirst({
      where: eq(broadcasts.id, broadcastId),
      with: {
        emailContent: true,
        abTestVariants: {
          orderBy: asc(abTestVariants.weight),
          with: {
            emailContent: true,
          },
        },
      },
    })

    expect(updatedBroadcast?.isAbTest).toBe(true)

    const variantsEmailContent = updatedBroadcast?.abTestVariants.map(
      ({
        name,
        weight,
        emailContent: {
          fromEmail,
          fromName,
          replyToEmail,
          replyToName,
          subject,
          contentHtml,
          contentText,
        },
      }) => ({
        name,
        weight,
        fromEmail,
        fromName,
        replyToEmail,
        replyToName,
        subject,
        contentHtml,
        contentText,
      }),
    )

    expect(variantsEmailContent).toStrictEqual(abTestVariantsMock)
  })

  test('cannot update ab test variants if weights sum up to more than 100', async ({
    expect,
  }) => {
    await refreshDatabase()
    const { user, audience } = await createUser()
    const database = makeDatabase()
    const broadcastId = await createBroadcastForUser(user, audience.id)

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
    expect(json).toMatchObject({
      message: 'Validation failed.',
      errors: [
        {
          message:
            'The sum of all ab test variant weights must be less than 100.',
        },
      ],
    })

    const updatedBroadcast = await database.query.broadcasts.findFirst({
      where: eq(broadcasts.id, broadcastId),
      with: {
        emailContent: true,
        abTestVariants: {
          orderBy: asc(abTestVariants.weight),
          with: {
            emailContent: true,
          },
        },
      },
    })

    expect(updatedBroadcast?.isAbTest).toBe(false)
  })
})
