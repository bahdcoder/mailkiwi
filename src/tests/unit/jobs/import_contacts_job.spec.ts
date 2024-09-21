import { count, desc, eq } from "drizzle-orm"
import { describe, test } from "vitest"

import { ImportContactsJob } from "@/audiences/jobs/import_contacts_job.js"
import { ContactImportRepository } from "@/audiences/repositories/contact_import_repository.js"

import { setupImport } from "@/tests/integration/audiences/contacts.spec.js"

import { contacts, tagsOnContacts } from "@/database/schema/schema.js"

import { makeDatabase, makeRedis } from "@/shared/container/index.js"

import { container } from "@/utils/typi.js"

describe.concurrent("@contacts import job", () => {
  test(
    "reads the csv content from storage and syncs all values to contacts",
    { timeout: 8000 },
    async ({ expect }) => {
      const { contactImport } = await setupImport(
        ".." + "/" + ".." + "/" + "audiences/mocks/contacts.csv",
        true,
      )

      const database = makeDatabase()
      const redis = makeRedis()

      await container.make(ImportContactsJob).handle({
        database,
        redis,
        payload: {
          contactImportId: contactImport?.id as string,
        },
      })

      const [{ count: totalContacts }] = await database
        .select({ count: count() })

        .from(contacts)
        .where(
          eq(contacts.audienceId, contactImport?.audienceId as string),
        )

      const [contact] = await database
        .select()
        .from(contacts)
        .where(
          eq(contacts.audienceId, contactImport?.audienceId as string),
        )
        .orderBy(desc(contacts.email))
        .limit(1)

      expect(contact.subscribedAt).toBe(null)
      expect(contact.email).toBeDefined()
      expect(contact.firstName).toBeDefined()
      expect(contact.lastName).toBeDefined()

      expect(contact.attributes?.["City"]).toBeDefined()
      expect(contact.attributes?.["Index"]).toBeDefined()
      expect(contact.attributes?.["Company"]).toBeDefined()
      expect(contact.attributes?.["Country"]).toBeDefined()

      expect(contact.attributes?.["Website"]).toBeDefined()
      expect(contact.attributes?.["Customer Id"]).toBeDefined()
      expect(contact.attributes?.["Subscription Date"]).toBeDefined()

      expect(totalContacts).toEqual(10000) // total contacts in test csv file

      // expect that the 2 tags were created alongside the upload
      const tags = await database.query.tags.findMany()

      const tagNames = tags.map((tag) => tag.name)

      expect(tagNames.includes("interested-in-book")).toBe(true)
      expect(tagNames.includes("ecommerce-prospects")).toBe(true)

      const [{ count: contactsTags }] = await database
        .select({ count: count() })
        .from(tagsOnContacts)

      expect(contactsTags).toBeGreaterThanOrEqual(30000) // 10,000 contacts * 3 new tags
    },
  )

  test(
    "when the job fails, it marks the import as failed and sends an email to the customer informing them.",
    { timeout: 8000 },
    async ({ expect }) => {
      const { contactImport } = await setupImport(
        ".." + "/" + ".." + "/" + "audiences/mocks/contacts-malformed.csv",
        true,
      )

      const database = makeDatabase()
      const redis = makeRedis()

      await container.make(ImportContactsJob).failed({
        database,
        redis,
        payload: {
          contactImportId: contactImport?.id as string,
        },
      })
      const updatedContactImport = await container
        .make(ContactImportRepository)
        .findById(contactImport?.id as string)

      expect(updatedContactImport?.status).toEqual("FAILED")
    },
  )
})
