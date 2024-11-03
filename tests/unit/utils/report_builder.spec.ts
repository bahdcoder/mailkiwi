import { faker } from "@faker-js/faker"
import { and, count, eq } from "drizzle-orm"
import { describe, test } from "vitest"

import { ReportBuilder } from "@/audiences/utils/report_builder/report_builder.js"

import { createFakeContact } from "@/tests/mocks/audiences/contacts.js"
import {
  createBroadcastForUser,
  createUser,
} from "@/tests/mocks/auth/users.js"
import { setupDomainForDnsChecks } from "@/tests/unit/jobs/check_sending_domain_dns_configuration_job.spec.js"

import {
  Audience,
  InsertEmailSendEvent,
} from "@/database/database_schema_types.js"
import {
  contacts,
  emailSendEvents,
  emailSends,
  sendingSources,
} from "@/database/schema.js"

import { makeDatabase } from "@/shared/container/index.js"
import { cuid } from "@/shared/utils/cuid/cuid.js"

import { container } from "@/utils/typi.js"

describe("@report-builder", () => {
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
    const TOTAL_SENDS = 10_000
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
        product: "engage" as InsertEmailSendEvent["product"],
        sendingDomainId,
      })),
    )

    const TOTAL_DELIVERED = 9_565
    const TOTAL_OPENS = 7_250
    const TOTAL_DOUBLE_OPENS = 1_250
    const TOTAL_CLICKS = 3_500
    const TOTAL_BOUNCES = 435

    const deliveredContactIds = contactIds.slice(0, TOTAL_DELIVERED)
    const bouncedContactIds = contactIds.slice(
      TOTAL_DELIVERED,
      TOTAL_SENDS,
    )

    const eventPayload = (
      contact: { id: string; emailSendId?: string },
      type: InsertEmailSendEvent["type"],
    ) => ({
      type,
      broadcastId,
      contactId: contact.id,
      audienceId: audience.id,
      emailSendId: contact.emailSendId as string,
      product: "engage" as InsertEmailSendEvent["product"],
    })

    const createEventsForContacts = (
      ids: {
        id: string
        emailSendId?: string
      }[],
      event: InsertEmailSendEvent["type"],
    ) => {
      return database
        .insert(emailSendEvents)
        .values(ids.map((contact) => eventPayload(contact, event)))
    }

    // 4. create 9,565 delivery events for 9,565 contacts
    await createEventsForContacts(deliveredContactIds, "Delivery")

    // 5. create 7,250 open events for 7,250 contacts
    const openContactIds = deliveredContactIds.slice(0, TOTAL_OPENS)

    await createEventsForContacts(openContactIds, "Open")

    // 6. create another 1,250 open events for 1,250 contacts (of the 7,250 contacts) (double open)

    const doubleOpensContactIds = openContactIds.slice(
      0,
      TOTAL_DOUBLE_OPENS,
    )

    await createEventsForContacts(doubleOpensContactIds, "Open")

    // 7. create 3,500 link clicks for 3,500 contacts
    const clickContactIds = openContactIds.slice(0, TOTAL_CLICKS)

    await createEventsForContacts(clickContactIds, "Click")

    // 8. create 435 bounce events for 435 contacts (bounce)
    await createEventsForContacts(bouncedContactIds, "Bounce")

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

  test(
    "can get reports for a campaign",
    { timeout: 20000 },
    async ({ expect }) => {
      const TOTAL_SENDS = 10_000
      const { user, audience, sendingDomainId } =
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

      const [broadcastId, secondBroadcastId, thirdBroadcastId] =
        await Promise.all([
          createBroadcastForUser(user, audience.id),
          createBroadcastForUser(user, audience.id),
          createBroadcastForUser(user, audience.id),
        ])

      const [source] = await database
        .select()
        .from(sendingSources)
        .limit(1)

      const [
        { TOTAL_CLICKS, TOTAL_DELIVERED, TOTAL_DOUBLE_OPENS, TOTAL_OPENS },
      ] = await Promise.all([
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

      const {
        sends,
        deliveries,
        opens,
        clicks,
        bounces,
        uniqueClicks,
        uniqueOpens,
        rates,
      } = await container
        .make(ReportBuilder)
        .broadcast(broadcastId)
        .build()

      expect(sends).toBe(TOTAL_SENDS)
      expect(deliveries).toBe(TOTAL_DELIVERED)
      expect(opens).toBe(TOTAL_OPENS + TOTAL_DOUBLE_OPENS)
      expect(uniqueOpens).toBe(TOTAL_OPENS)
      expect(clicks).toBe(TOTAL_CLICKS)
      expect(uniqueClicks).toBe(TOTAL_CLICKS)
      expect(bounces).toBe(TOTAL_SENDS - TOTAL_DELIVERED)

      expect(rates.deliveries).toEqual("95.65")
      expect(rates.opens).toEqual("88.87")
      expect(rates.clicks).toEqual("36.59")
      expect(rates.uniqueOpens).toEqual("75.80")
      expect(rates.uniqueClicks).toEqual("36.59")

      const audienceReport = await container
        .make(ReportBuilder)
        .audience(audience.id)
        .build()

      expect(audienceReport.rates.deliveries).toEqual("95.65")
      expect(audienceReport.rates.opens).toEqual("88.87")
      expect(audienceReport.rates.clicks).toEqual("36.59")
      expect(audienceReport.rates.uniqueOpens).toEqual("75.80")
      expect(audienceReport.rates.uniqueClicks).toEqual("36.59")

      expect(audienceReport.sends).toEqual(TOTAL_SENDS * 3)
      expect(audienceReport.deliveries).toEqual(TOTAL_DELIVERED * 3)
      expect(audienceReport.opens).toEqual(
        (TOTAL_OPENS + TOTAL_DOUBLE_OPENS) * 3,
      )
      expect(audienceReport.uniqueOpens).toEqual(TOTAL_OPENS * 3)
      expect(audienceReport.clicks).toEqual(TOTAL_CLICKS * 3)
      expect(audienceReport.uniqueClicks).toEqual(TOTAL_CLICKS * 3)
      expect(audienceReport.bounces).toEqual(
        (TOTAL_SENDS - TOTAL_DELIVERED) * 3,
      )
    },
  )
})
