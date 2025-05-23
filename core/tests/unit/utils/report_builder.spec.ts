import { faker } from '@faker-js/faker'
import { eq } from 'drizzle-orm'
import { describe, test } from 'vitest'

import { ReportBuilder } from '#root/core/audiences/utils/report_builder/report_builder.js'

import { createFakeContact } from '#root/core/tests/mocks/audiences/contacts.js'
import { createBroadcastForUser } from '#root/core/tests/mocks/auth/users.js'

import type { InsertEmailSendEvent } from '#root/database/database_schema_types.js'
import {
  contacts,
  emailSendEvents,
  emailSends,
  sendingSources,
} from '#root/database/schema.js'

import { makeDatabase } from '#root/core/shared/container/index.js'
import { cuid } from '#root/core/shared/utils/cuid/cuid.js'

import { container } from '#root/core/utils/typi.js'
import { setupDomainForDnsChecks } from '#root/core/tests/unit/helpers/domains/setup_domain_for_dns_checks.js'

describe('@report-builder', () => {
  async function prepareBatchOfContactsForReport({
    audience,
    source,
    broadcastId,
    sendingDomainId,
  }: {
    audience: { id: string }
    source: { id: string }
    broadcastId: string
    sendingDomainId: string
  }) {
    const TOTAL_SENDS = 100
    const database = makeDatabase()
    let contactIds: { id: string; emailSendId?: string }[] = await database
      .select({ id: contacts.id })
      .from(contacts)
      .where(eq(contacts.audienceId, audience.id))

    // 2. create 1 broadcast and 1 audience

    contactIds = contactIds.map((contact) => ({
      ...contact,
      emailSendId: cuid(),
    }))

    // 3. create 10,000 email sends, 1 for each contact
    await database.insert(emailSends).values(
      contactIds.map((contact) => ({
        id: contact.emailSendId,
        sendingSourceId: source.id,
        contactId: contact.id,
        audienceId: audience.id,
        broadcastId,
        product: 'engage' as InsertEmailSendEvent['product'],
        sendingDomainId,
      })),
    )

    const TOTAL_DELIVERED = 95
    const TOTAL_OPENS = 73
    const TOTAL_DOUBLE_OPENS = 13
    const TOTAL_CLICKS = 35
    const TOTAL_BOUNCES = 43

    const deliveredContactIds = contactIds.slice(0, TOTAL_DELIVERED)
    const bouncedContactIds = contactIds.slice(TOTAL_DELIVERED, TOTAL_SENDS)

    const eventPayload = (
      contact: { id: string; emailSendId?: string },
      type: InsertEmailSendEvent['type'],
    ) => ({
      type,
      broadcastId,
      contactId: contact.id,
      audienceId: audience.id,
      emailSendId: contact.emailSendId as string,
      product: 'engage' as InsertEmailSendEvent['product'],
    })

    const createEventsForContacts = (
      ids: {
        id: string
        emailSendId?: string
      }[],
      event: InsertEmailSendEvent['type'],
    ) => {
      return database
        .insert(emailSendEvents)
        .values(ids.map((contact) => eventPayload(contact, event)))
    }

    // 4. create 9,565 delivery events for 9,565 contacts
    await createEventsForContacts(deliveredContactIds, 'Delivery')

    // 5. create 7,250 open events for 7,250 contacts
    const openContactIds = deliveredContactIds.slice(0, TOTAL_OPENS)

    await createEventsForContacts(openContactIds, 'Open')

    // 6. create another 1,250 open events for 1,250 contacts (of the 7,250 contacts) (double open)

    const doubleOpensContactIds = openContactIds.slice(0, TOTAL_DOUBLE_OPENS)

    await createEventsForContacts(doubleOpensContactIds, 'Open')

    // 7. create 3,500 link clicks for 3,500 contacts
    const clickContactIds = openContactIds.slice(0, TOTAL_CLICKS)

    await createEventsForContacts(clickContactIds, 'Click')

    // 8. create 435 bounce events for 435 contacts (bounce)
    await createEventsForContacts(bouncedContactIds, 'Bounce')

    return {
      contactIds,
      TOTAL_BOUNCES,
      TOTAL_CLICKS,
      TOTAL_DELIVERED,
      TOTAL_DOUBLE_OPENS,
      TOTAL_OPENS,
      TOTAL_SENDS,
    }
  }

  test('can get reports for a campaign', { timeout: 20000 }, async ({ expect }) => {
    const TOTAL_SENDS = 100
    const { user, audience, sendingDomainId, broadcastGroupId, team } =
      await setupDomainForDnsChecks()
    const database = makeDatabase()
    // 1. create 10,000 contacts
    await database
      .insert(contacts)
      .values(
        faker.helpers
          .multiple(faker.lorem.word, { count: TOTAL_SENDS })
          .map(() => createFakeContact(audience.id)),
      )

    const [broadcastId, secondBroadcastId, thirdBroadcastId] = await Promise.all([
      createBroadcastForUser(user, team.id, audience.id, broadcastGroupId),
      createBroadcastForUser(user, team.id, audience.id, broadcastGroupId),
      createBroadcastForUser(user, team.id, audience.id, broadcastGroupId),
    ])

    const [source] = await database.select().from(sendingSources).limit(1)

    const [{ TOTAL_CLICKS, TOTAL_DELIVERED, TOTAL_DOUBLE_OPENS, TOTAL_OPENS }] =
      await Promise.all([
        prepareBatchOfContactsForReport({
          broadcastId,
          source,
          sendingDomainId,
          audience,
        }),
        prepareBatchOfContactsForReport({
          broadcastId: secondBroadcastId,
          source,
          sendingDomainId,
          audience,
        }),
        prepareBatchOfContactsForReport({
          broadcastId: thirdBroadcastId,
          source,
          sendingDomainId,
          audience,
        }),
      ])

    const broadcastReport = await new ReportBuilder().broadcast(broadcastId).build()

    const {
      sends,
      deliveries,
      opens,
      clicks,
      bounces,
      uniqueClicks,
      uniqueOpens,
      rates,
    } = broadcastReport

    expect(sends).toBe(TOTAL_SENDS)
    expect(deliveries).toBe(TOTAL_DELIVERED)
    expect(opens).toBe(TOTAL_OPENS + TOTAL_DOUBLE_OPENS)
    expect(uniqueOpens).toBe(TOTAL_OPENS)
    expect(clicks).toBe(TOTAL_CLICKS)
    expect(uniqueClicks).toBe(TOTAL_CLICKS)
    expect(bounces).toBe(TOTAL_SENDS - TOTAL_DELIVERED)

    expect(rates.deliveries).toEqual('95.00')
    expect(rates.opens).toEqual('90.53')
    expect(rates.clicks).toEqual('36.84')
    expect(rates.bounces).toEqual('5.26')
    expect(rates.uniqueOpens).toEqual('76.84')
    expect(rates.uniqueClicks).toEqual('36.84')

    const audienceReport = await new ReportBuilder().audience(audience.id).build()

    expect(audienceReport.rates.deliveries).toEqual('95.00')
    expect(audienceReport.rates.opens).toEqual('90.53')
    expect(audienceReport.rates.clicks).toEqual('36.84')
    expect(audienceReport.rates.bounces).toEqual('5.26')
    expect(audienceReport.rates.uniqueOpens).toEqual('76.84')
    expect(audienceReport.rates.uniqueClicks).toEqual('36.84')

    expect(audienceReport.sends).toEqual(TOTAL_SENDS * 3)
    expect(audienceReport.deliveries).toEqual(TOTAL_DELIVERED * 3)
    expect(audienceReport.opens).toEqual((TOTAL_OPENS + TOTAL_DOUBLE_OPENS) * 3)
    expect(audienceReport.uniqueOpens).toEqual(TOTAL_OPENS * 3)
    expect(audienceReport.clicks).toEqual(TOTAL_CLICKS * 3)
    expect(audienceReport.uniqueClicks).toEqual(TOTAL_CLICKS * 3)
    expect(audienceReport.bounces).toEqual((TOTAL_SENDS - TOTAL_DELIVERED) * 3)
  })
})
