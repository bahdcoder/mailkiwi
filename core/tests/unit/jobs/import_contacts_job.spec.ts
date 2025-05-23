import { appEnv } from '#root/core/app/env/app_env.js'
import { asc, count, eq } from 'drizzle-orm'
import { describe, test } from 'vitest'

import { ImportContactsJob } from '#root/core/audiences/jobs/import_contacts_job.js'
import { ContactImportRepository } from '#root/core/audiences/repositories/contact_import_repository.js'
import { ContactRepository } from '#root/core/audiences/repositories/contact_repository.js'

import { audiences, contacts, tagsOnContacts } from '#root/database/schema.js'

import { makeDatabase, makeLogger, makeRedis } from '#root/core/shared/container/index.js'

import { container } from '#root/core/utils/typi.js'
import { setupImport } from '#root/core/tests/integration/helpers/contacts/setup_imports.js'

describe('@contacts import job', () => {
  test('reads the csv content from storage and syncs all values to contacts', async ({
    expect,
  }) => {
    const { contactImport } = await setupImport('contacts.csv', true)

    const database = makeDatabase()
    const redis = makeRedis()

    await container.make(ImportContactsJob).handle({
      database,
      redis,
      payload: {
        contactImportId: contactImport?.id as string,
      },
      logger: makeLogger(),
    })

    const [{ count: totalContacts }] = await database
      .select({ count: count() })
      .from(contacts)
      .where(eq(contacts.audienceId, contactImport?.audienceId as string))

    const [audience] = await database
      .select()
      .from(audiences)
      .where(eq(audiences.id, contactImport?.audienceId as string))

    const [contact] = await database
      .select()
      .from(contacts)
      .where(eq(contacts.audienceId, contactImport?.audienceId as string))
      .orderBy(asc(contacts.email))
      .limit(1)

    const contactWithProperties = await container
      .make(ContactRepository)
      .findById(contact.id)

    expect(contact.subscribedAt).toBe(null)
    expect(contact.email).toBeDefined()
    expect(contact.firstName).toBeDefined()
    expect(contact.lastName).toBeDefined()

    const knownPropertiesKeys = audience.knownProperties?.map((property) => property.id)

    expect(knownPropertiesKeys).toEqual([
      'age',
      'profession',
      'company',
      'customerId',
      'index',
      'city',
      'phone1',
      'phone2',
      'subscriptionDate',
      'website',
    ])

    expect(contactWithProperties.properties.map((property) => property.name)).toEqual([
      'city',
      'index',
      'company',
      'phone1',
      'phone2',
      'website',
      'customerId',
      'subscriptionDate',
    ])

    expect(totalContacts).toEqual(360) // total contacts in test csv file

    // expect that the 2 tags were created alongside the upload
    const tags = await database.query.tags.findMany()

    const tagNames = tags.map((tag) => tag.name)

    expect(tagNames.includes('interested-in-book')).toBe(true)
    expect(tagNames.includes('ecommerce-prospects')).toBe(true)

    const [{ count: contactsTags }] = await database
      .select({ count: count() })
      .from(tagsOnContacts)

    expect(contactsTags).toBeGreaterThanOrEqual(1080) // 360 contacts * 3 new tags

    container.restoreAll()
  })

  test(
    'when the job fails, it marks the import as failed and sends an email to the customer informing them.',
    { timeout: 20000 },
    async ({ expect }) => {
      const { contactImport } = await setupImport('contacts-malformed.csv', true)

      const database = makeDatabase()
      const redis = makeRedis()

      await container.make(ImportContactsJob).failed({
        database,
        redis,
        payload: {
          contactImportId: contactImport?.id as string,
        },
        logger: makeLogger(),
      })
      const updatedContactImport = await container
        .make(ContactImportRepository)
        .findById(contactImport?.id as string)

      expect(updatedContactImport?.status).toEqual('FAILED')
    },
  )
})
