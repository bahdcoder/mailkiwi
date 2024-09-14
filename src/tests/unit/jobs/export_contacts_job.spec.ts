import { MinioClient } from "@/minio/minio_client.ts"
import { faker } from "@faker-js/faker"
import { like } from "drizzle-orm"
import { Readable } from "stream"
import { describe, test } from "vitest"

import { CreateContactExportDto } from "@/audiences/dto/contact_exports/create_contact_export_dto.ts"
import { ExportContactsJob } from "@/audiences/jobs/export_contacts_job.ts"
import { AudienceRepository } from "@/audiences/repositories/audience_repository.ts"
import { TagRepository } from "@/audiences/repositories/tag_repository.ts"

import { createFakeContact } from "@/tests/mocks/audiences/contacts.ts"
import { createUser } from "@/tests/mocks/auth/users.ts"
import { FakeMinioClient } from "@/tests/mocks/container/minio_client_mock.ts"
import {
  refreshDatabase,
  refreshRedisDatabase,
} from "@/tests/mocks/teams/teams.ts"

import {
  contacts,
  emails,
  tagsOnContacts,
} from "@/database/schema/schema.ts"

import { makeDatabase, makeRedis } from "@/shared/container/index.ts"

import { container } from "@/utils/typi.ts"

describe("@contacts exports job", () => {
  test.only("exports only contacts that match the filter groups criteria", async ({
    expect,
  }) => {
    await refreshDatabase()

    const { audience, user } = await createUser()
    const database = makeDatabase()
    const redis = makeRedis()

    await container
      .resolve(AudienceRepository)
      .update(
        { knownAttributesKeys: ["Phone", "Country Code", "Country"] },
        audience.id,
      )

    const tagsToCreate = [
      { name: faker.string.uuid(), audienceId: audience.id },
      { name: faker.string.uuid(), audienceId: audience.id },
    ]

    const createdTags = await container
      .make(TagRepository)
      .bulkCreate(tagsToCreate)

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
      contactsWithEmailStartingWith
        .map((contact) => {
          return createdTags.map((tag) => ({
            tagId: tag.id,
            contactId: contact.id,
          }))
        })
        .flat(),
    )
    // insert n contacts that match second part of OR conditions
    await database.insert(contacts).values(
      faker.helpers
        .multiple(faker.lorem.word, {
          count: totalMatchingGroupB,
        })
        .map(() =>
          createFakeContact(audience.id, {
            firstName: firstNameContains + " " + faker.person.firstName(),
            attributes: {
              Country: faker.location.country(),
              "Country Code": faker.location.countryCode(),
              Phone: faker.phone.number(),
            },
          }),
        ),
    )

    const filterGroups: CreateContactExportDto["filterGroups"] = {
      type: "OR",
      groups: [
        {
          type: "AND",
          conditions: [
            {
              field: "email",
              operation: "startsWith",
              value: emailStartsWith,
            },
          ],
        },
        {
          type: "AND",
          conditions: [
            {
              field: "firstName",
              operation: "contains",
              value: firstNameContains,
            },
          ],
        },
      ],
    }

    const minio = new FakeMinioClient()

    // container.fake(MinioClient, minio as any)

    await container.make(ExportContactsJob).handle({
      payload: {
        filterGroups,
        exportCreatedBy: user.id,
        audienceId: audience.id,
      },
      redis,
      database,
    })
    return

    expect(minio.bucketName).toEqual("contacts")
    expect(minio.objectName).toMatch("exports/")
    expect(minio.objectName).toMatch(".csv")

    const buffer = await streamToBuffer(minio.stream)

    const exportedContacts = buffer.toString().split("\n")

    expect(exportedContacts).toHaveLength(totalToBeExported + 2) // one line for headers and last line as empty space end of line.

    expect(exportedContacts[0]).toEqual(
      "First name,Last name,Email,Subscribed at,Phone,Country Code,Country,Tags",
    )

    container.restoreAll()
  })
})

export async function streamToBuffer(stream: Readable): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = []
    stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)))
    stream.on("error", (err) => reject(err))
    stream.on("end", () => resolve(Buffer.concat(chunks)))
  })
}
