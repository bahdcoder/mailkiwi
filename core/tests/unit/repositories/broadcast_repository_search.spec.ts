import { faker } from '@faker-js/faker'
import { eq } from 'drizzle-orm'
import { describe, test } from 'vitest'

import { BroadcastRepository } from '#root/core/broadcasts/repositories/broadcast_repository.js'
import { createUser } from '#root/core/tests/mocks/auth/users.js'
import { broadcasts, emailContents } from '#root/database/schema.js'
import { makeDatabase } from '#root/core/shared/container/index.js'
import { container } from '#root/core/utils/typi.js'

describe('@broadcast repository search and filtering', () => {
  test('can filter broadcasts by status', async ({ expect }) => {
    const { user, audience, broadcastGroupId, team } = await createUser()
    const database = makeDatabase()
    const repository = container.make(BroadcastRepository)

    // Create broadcasts with different statuses
    const draftBroadcast = await repository.create(
      {
        name: 'Draft Broadcast',
        audienceId: audience.id,
        broadcastGroupId,
      },
      team.id,
    )

    const sentBroadcast = await repository.create(
      {
        name: 'Sent Broadcast',
        audienceId: audience.id,
        broadcastGroupId,
      },
      team.id,
    )

    // Update one broadcast to SENT status
    await database
      .update(broadcasts)
      .set({ status: 'SENT' })
      .where(eq(broadcasts.id, sentBroadcast.id))

    // Test filtering by draft status
    const draftBroadcasts = await repository.findAllForTeam(team.id, { status: 'draft' })
    expect(draftBroadcasts).toHaveLength(1)
    expect(draftBroadcasts[0].id).toBe(draftBroadcast.id)
    expect(draftBroadcasts[0].status).toBe('DRAFT')

    // Test filtering by sent status
    const sentBroadcasts = await repository.findAllForTeam(team.id, { status: 'sent' })
    expect(sentBroadcasts).toHaveLength(1)
    expect(sentBroadcasts[0].id).toBe(sentBroadcast.id)
    expect(sentBroadcasts[0].status).toBe('SENT')

    // Test getting all broadcasts
    const allBroadcasts = await repository.findAllForTeam(team.id, { status: 'all' })
    expect(allBroadcasts).toHaveLength(2)

    // Test filtering with no results
    const scheduledBroadcasts = await repository.findAllForTeam(team.id, {
      status: 'scheduled',
    })
    expect(scheduledBroadcasts).toHaveLength(0)
  })

  test('can search broadcasts by name', async ({ expect }) => {
    const { user, audience, broadcastGroupId, team } = await createUser()
    const repository = container.make(BroadcastRepository)

    // Create broadcasts with different names
    await repository.create(
      {
        name: 'Newsletter Weekly Update',
        audienceId: audience.id,
        broadcastGroupId,
      },
      team.id,
    )

    await repository.create(
      {
        name: 'Product Launch Announcement',
        audienceId: audience.id,
        broadcastGroupId,
      },
      team.id,
    )

    await repository.create(
      {
        name: 'Monthly Newsletter',
        audienceId: audience.id,
        broadcastGroupId,
      },
      team.id,
    )

    // Test searching for "Newsletter"
    const newsletterBroadcasts = await repository.findAllForTeam(team.id, {
      search: 'Newsletter',
    })
    expect(newsletterBroadcasts).toHaveLength(2)
    expect(newsletterBroadcasts.every((b) => b.name.includes('Newsletter'))).toBe(true)

    // Test searching for "Product"
    const productBroadcasts = await repository.findAllForTeam(team.id, {
      search: 'Product',
    })
    expect(productBroadcasts).toHaveLength(1)
    expect(productBroadcasts[0].name).toBe('Product Launch Announcement')

    // Test case-insensitive search
    const weeklyBroadcasts = await repository.findAllForTeam(team.id, {
      search: 'weekly',
    })
    expect(weeklyBroadcasts).toHaveLength(1)
    expect(weeklyBroadcasts[0].name).toBe('Newsletter Weekly Update')

    // Test search with no results
    const noResultsBroadcasts = await repository.findAllForTeam(team.id, {
      search: 'NonExistentTerm',
    })
    expect(noResultsBroadcasts).toHaveLength(0)
  })

  test('can combine search and status filtering', async ({ expect }) => {
    const { user, audience, broadcastGroupId, team } = await createUser()
    const database = makeDatabase()
    const repository = container.make(BroadcastRepository)

    // Create broadcasts
    const draftNewsletter = await repository.create(
      {
        name: 'Draft Newsletter',
        audienceId: audience.id,
        broadcastGroupId,
      },
      team.id,
    )

    const sentNewsletter = await repository.create(
      {
        name: 'Sent Newsletter',
        audienceId: audience.id,
        broadcastGroupId,
      },
      team.id,
    )

    const draftProduct = await repository.create(
      {
        name: 'Draft Product Update',
        audienceId: audience.id,
        broadcastGroupId,
      },
      team.id,
    )

    // Update one newsletter to SENT status
    await database
      .update(broadcasts)
      .set({ status: 'SENT' })
      .where(eq(broadcasts.id, sentNewsletter.id))

    // Test combining search and status filter
    const draftNewsletters = await repository.findAllForTeam(team.id, {
      search: 'Newsletter',
      status: 'draft',
    })

    expect(draftNewsletters).toHaveLength(1)
    expect(draftNewsletters[0].id).toBe(draftNewsletter.id)
    expect(draftNewsletters[0].status).toBe('DRAFT')
    expect(draftNewsletters[0].name).toBe('Draft Newsletter')
  })
})
