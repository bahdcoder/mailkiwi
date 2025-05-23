import type { Readable } from 'node:stream'
import { MinioClient } from '#root/core/minio/minio_client.js'
import { faker } from '@faker-js/faker'
import { like } from 'drizzle-orm'
import { describe, test } from 'vitest'

import type { CreateContactExportDto } from '#root/core/audiences/dto/contact_exports/create_contact_export_dto.js'
import { ExportContactsJob } from '#root/core/audiences/jobs/export_contacts_job.js'
import { AudienceRepository } from '#root/core/audiences/repositories/audience_repository.js'
import { TagRepository } from '#root/core/audiences/repositories/tag_repository.js'

import { createFakeContact } from '#root/core/tests/mocks/audiences/contacts.js'
import { createUser } from '#root/core/tests/mocks/auth/users.js'
import { FakeMinioClient } from '#root/core/tests/mocks/container/minio_client_mock.js'

import { contacts, emails, tagsOnContacts } from '#root/database/schema.js'

import { makeDatabase, makeLogger, makeRedis } from '#root/core/shared/container/index.js'

import { container } from '#root/core/utils/typi.js'

describe('@contacts exports job', () => {
  test('exports only contacts that match the filter groups criteria', async ({
    expect,
  }) => {
    const { audience, user } = await createUser()
    const database = makeDatabase()
    const redis = makeRedis()

    await container.resolve(AudienceRepository).update(
      {
        knownProperties: [
          { label: 'Phone', id: 'phone', type: 'text' },
          { label: 'Country Code', id: 'countryCode', type: 'text' },
          { label: 'Country', id: 'country', type: 'text' },
        ],
      },
      audience.id,
    )

    const tagsToCreate = [
      { name: faker.string.uuid(), audienceId: audience.id },
      { name: faker.string.uuid(), audienceId: audience.id },
    ]

    const createdTags = await container.make(TagRepository).bulkCreate(tagsToCreate)

    // bulk insert a bunch of random contacts for an audience
    await database
      .insert(contacts)
      .values(
        faker.helpers
          .multiple(() => faker.string.uuid, { count: 100 })
          .map(() => createFakeContact(audience.id)),
      )

    const emailStartsWith = faker.string.uuid()
    const firstNameContains = faker.string.uuid()

    const totalMatchingGroupA = 16
    const totalMatchingGroupB = 23

    const totalToBeExported = totalMatchingGroupA + totalMatchingGroupB

    // insert n contacts that match first part of OR conditions
    await database.insert(contacts).values(
      faker.helpers
        .multiple(faker.lorem.word, {
          count: totalMatchingGroupA,
        })
        .map(() =>
          createFakeContact(audience.id, {
            email: emailStartsWith + faker.internet.email(),
          }),
        ),
    )

    const contactsWithEmailStartingWith = await database
      .select()
      .from(contacts)
      .where(like(contacts.email, `${emailStartsWith}%`))

    // associate all contacts with 2 tags, preparing for export.
    await database.insert(tagsOnContacts).values(
      contactsWithEmailStartingWith.flatMap((contact) => {
        return createdTags.map((tag) => ({
          tagId: tag.id,
          contactId: contact.id,
        }))
      }),
    )

    // insert n contacts that match second part of OR conditions
    await database.insert(contacts).values(
      faker.helpers
        .multiple(faker.lorem.word, {
          count: totalMatchingGroupB,
        })
        .map(() =>
          createFakeContact(audience.id, {
            firstName: `${firstNameContains} ${faker.person.firstName()}`,
            attributes: {
              Country: faker.location.country(),
              'Country Code': faker.location.countryCode(),
              Phone: faker.phone.number(),
            },
          }),
        ),
    )

    const filterGroups: CreateContactExportDto['filterGroups'] = {
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
        {
          type: 'AND',
          conditions: [
            {
              field: 'firstName',
              operation: 'contains',
              value: firstNameContains,
            },
          ],
        },
      ],
    }

    const minio = new FakeMinioClient()

    container.fake(MinioClient, minio as unknown as MinioClient)

    await container.make(ExportContactsJob).handle({
      payload: {
        filterGroups,
        exportCreatedBy: user.id,
        audienceId: audience.id,
      },
      redis,
      database,
      logger: makeLogger(),
    })

    expect(minio.bucketName).toEqual('contacts')
    expect(minio.objectName).toMatch('exports/')
    expect(minio.objectName).toMatch('.csv')

    const buffer = await streamToBuffer(minio.stream)

    const exportedContacts = buffer.toString().split('\n')

    expect(exportedContacts).toHaveLength(totalToBeExported + 2) // one line for headers and last line as empty space end of line.

    expect(exportedContacts[0]).toEqual(
      'First name,Last name,Email,Subscribed at,Phone,Country Code,Country,Tags',
    )

    container.restoreAll()
  })
})

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = []
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
    stream.on('error', (err) => reject(err))
    stream.on('end', () => resolve(Buffer.concat(chunks)))
  })
}
