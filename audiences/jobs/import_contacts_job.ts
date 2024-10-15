import { makeMinioClient } from "@/minio/minio_client.js"
import CsvParser from "csv-parser"
import { and, eq, sql } from "drizzle-orm"
import { DateTime } from "luxon"

import { AudienceRepository } from "@/audiences/repositories/audience_repository.js"
import { ContactImportRepository } from "@/audiences/repositories/contact_import_repository.js"
import { ContactRepository } from "@/audiences/repositories/contact_repository.js"
import { TagRepository } from "@/audiences/repositories/tag_repository.js"

import { ContactProperty } from "@/database/database_schema_types.js"
import {
  KnownAudienceProperty,
  contactProperties,
  contacts,
  tagsOnContacts,
} from "@/database/schema.js"

import { BaseJob, type JobContext } from "@/shared/queue/abstract_job.js"
import { AVAILABLE_QUEUES } from "@/shared/queue/config.js"
import { cuid } from "@/shared/utils/cuid/cuid.js"
import { guessValueType } from "@/shared/utils/helpers/guess_value_type.js"

import { container } from "@/utils/typi.js"

export interface ImportContactsJobPayload {
  contactImportId: string
}

export class ImportContactsJob extends BaseJob<ImportContactsJobPayload> {
  static get id() {
    return "ACCOUNTS::CONTACTS"
  }

  static get queue() {
    return AVAILABLE_QUEUES.contacts
  }

  guessCsvCustomProperties(properties: string[], rows: any[]) {
    return properties.map((property) => {
      const guessedTypesFrequency: Record<string, number> = {}

      for (const row of rows) {
        const type = guessValueType(row[property])

        guessedTypesFrequency[type] =
          (guessedTypesFrequency[type] || 0) + 1
      }

      function getKeyWithHighestValue(record: Record<string, number>) {
        let maxKey: string | null = null
        let maxValue = -Infinity // Initialize with the smallest possible value

        // Iterate over the object's keys and values
        for (const [key, value] of Object.entries(record)) {
          if (value > maxValue) {
            maxValue = value
            maxKey = key
          }
        }

        return maxKey as KnownAudienceProperty["type"]
      }

      return {
        name: property,
        type: getKeyWithHighestValue(guessedTypesFrequency),
      }
    })
  }

  async handle({
    database,
    payload,
  }: JobContext<ImportContactsJobPayload>) {
    const contactImport = await container
      .make(ContactImportRepository)
      .findById(payload.contactImportId)

    if (!contactImport) {
      return this.done()
    }

    const csvStream = await makeMinioClient()
      .bucket("contacts")
      .name(`${contactImport.fileIdentifier}.csv`)
      .read()

    const parser = csvStream.pipe(CsvParser())

    const rows: any[] = await new Promise(function (resolve, reject) {
      const rows: any[] = []

      parser
        .on("data", async function (row) {
          rows.push(row)
        })
        .on("end", function () {
          return resolve(rows)
        })
        .on("error", function (error) {
          return reject(error)
        })
    })

    const knownProperties = this.guessCsvCustomProperties(
      contactImport.attributesMap.attributes,
      rows,
    )

    const contactRepository = container.make(ContactRepository)

    const chunkSize = 1000

    await database.transaction(async (tx) => {
      await container
        .make(AudienceRepository)
        .transaction(tx)
        .updateKnownProperties(contactImport.audienceId, knownProperties)

      const tagsToCreate = contactImport.attributesMap.tags.map((tag) => ({
        id: cuid(),
        name: tag,
        audienceId: contactImport.audienceId,
      }))

      const createdTags = await container
        .make(TagRepository)
        .transaction(tx)
        .bulkCreate(tagsToCreate)

      const tagIdsToAttachToContacts = [
        ...createdTags.map((tag) => tag.id),
        ...contactImport.attributesMap.tagIds,
      ]

      // const tagsToCreate
      for (let i = 0; i < rows.length; i += chunkSize) {
        const batch = rows.slice(i, i + chunkSize)

        const allContactProperties: ContactProperty[] = []

        const values = batch.map((row) => {
          const attributes: Record<string, string> = {}

          const contactId = cuid()

          for (const attribute of contactImport.attributesMap.attributes) {
            attributes[attribute] = row[attribute]
          }

          const payloadProperties =
            contactRepository.getContactPropertiesFromPayloadProperties(
              contactId,
              contactImport.audienceId,
              attributes,
            )
          allContactProperties.push(
            ...payloadProperties.contactPropertiesPayload,
          )

          return {
            id: contactId,
            email: row[contactImport.attributesMap.email],
            firstName: row[contactImport.attributesMap.firstName],
            lastName: row[contactImport.attributesMap.lastName],
            subscribedAt: contactImport.subscribeAllContacts
              ? DateTime.now().toJSDate()
              : undefined,
            audienceId: contactImport.audienceId,
            contactImportId: payload.contactImportId,
          }
        })

        const createdContacts = await contactRepository
          .transaction(tx)
          .bulkCreate(values, {
            set: contactImport.updateExistingContacts
              ? {
                  firstName: sql`values(${contacts.firstName})`,
                  lastName: sql`values(${contacts.lastName})`,
                  email: sql`${contacts.email}`, // no change
                }
              : {},
          })

        for (let z = 0; z < allContactProperties.length; z += chunkSize) {
          const contactPropertiesBatch = allContactProperties.slice(
            z,
            z + chunkSize,
          )

          if (contactPropertiesBatch.length > 0) {
            await tx
              .insert(contactProperties)
              .values(contactPropertiesBatch)
              .onDuplicateKeyUpdate({
                set: {
                  float: sql`values(${contactProperties.float})`,
                  date: sql`values(${contactProperties.date})`,
                  text: sql`values(${contactProperties.text})`,
                  boolean: sql`values(${contactProperties.boolean})`,
                },
              })
          }
        }

        const contactIds = createdContacts.map((value) => value.id)

        const attachTagsToContacts = tagIdsToAttachToContacts
          .map((tagId) =>
            contactIds.map((contactId) => ({
              contactId,
              tagId,
              assignedAt: new Date(),
            })),
          )
          .flat()

        // batch insert tags.
        if (attachTagsToContacts.length > 0) {
          for (
            let t = 0;
            t < attachTagsToContacts.length;
            t += chunkSize
          ) {
            const tagsBatch = attachTagsToContacts.slice(t, t + chunkSize)

            await tx.insert(tagsOnContacts).values(tagsBatch)
          }
        }
      }

      await container
        .make(ContactImportRepository)
        .transaction(tx)
        .update(contactImport.id, {
          status: "SUCCESS",
        })
    })

    return this.done()
  }

  async failed({ payload }: JobContext<ImportContactsJobPayload>) {
    await container
      .make(ContactImportRepository)
      .update(payload.contactImportId, { status: "FAILED" })

    // await Mailer.from(env.SMTP_MAIL_FROM)
    //   .to(invite.email)
    //   .subject("You've been invited to join a team on Kibamail.")
    //   .content(
    //     JSON.stringify({
    //       transactionalEmailId: "transactionalEmailId",
    //       variables: {
    //         token,
    //       },
    //     }),
    //   )
    //   .send()
  }
}
