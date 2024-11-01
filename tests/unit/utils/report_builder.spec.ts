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

import { InsertEmailSendEvent } from "@/database/database_schema_types.js"
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
  test(
    "can get reports for a campaign",
    { timeout: 10000 },
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

      let contactIds: { id: string; emailSendId?: string }[] =
        await database
          .select({ id: contacts.id })
          .from(contacts)
          .where(eq(contacts.audienceId, audience.id))

      // 2. create 1 broadcast and 1 audience

      const broadcastId = await createBroadcastForUser(user, audience.id)

      const [source] = await database
        .select()
        .from(sendingSources)
        .limit(1)

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

      const {
        sends,
        deliveries,
        opens,
        clicks,
        bounces,
        uniqueClicks,
        uniqueOpens,
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
    },
  )
})
