import { makeS3Client } from "@/minio/s3_client.js"
import CsvParser from "csv-parser"
import { sql } from "drizzle-orm"
import { DateTime } from "luxon"

import { AudienceRepository } from "@/audiences/repositories/audience_repository.js"
import { ContactImportRepository } from "@/audiences/repositories/contact_import_repository.js"
import { ContactRepository } from "@/audiences/repositories/contact_repository.js"
import { TagRepository } from "@/audiences/repositories/tag_repository.js"

import { TeamRepository } from "@/teams/repositories/team_repository.js"

import {
  ContactImport,
  type ContactProperty,
} from "@/database/database_schema_types.js"
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

  async handle({
    database,
    payload,
    logger,
  }: JobContext<ImportContactsJobPayload>) {
    const contactImport = await container
      .make(ContactImportRepository)
      .findById(payload.contactImportId)

    if (!contactImport) {
      logger.info(
        `Contact import with ID ${payload.contactImportId} does not exist.`
      )
      return this.done()
    }

    const audience = await container
      .make(AudienceRepository)
      .findById(contactImport?.audienceId)

    if (!audience) {
      logger.info(
        `Audience with ID ${contactImport?.audienceId} does not exist.`
      )
      return this.done()
    }

    const team = await container.make(TeamRepository).findById(audience?.teamId)

    logger.info(`Processing import for team ${team?.id}.`)

    const csvStream = await makeS3Client().getObjectStream(
      ContactImportRepository.getUploadedFileKey(
        contactImport.id,
        "csv",
        team.id
      )
    )

    const parser = csvStream.pipe(CsvParser())

    const rows: any[] = await new Promise((resolve, reject) => {
      const rows: any[] = []

      parser
        .on("data", async (row) => {
          rows.push(row)
        })
        .on("end", () => resolve(rows))
        .on("error", (error) => reject(error))
    })

    logger.info(`Importing ${rows.length} contacts from csv.`)

    const contactRepository = container.make(ContactRepository)

    const chunkSize = 1000

    await database.transaction(async (tx) => {
      const tagsToCreate = contactImport.propertiesMap.tags.map((tag) => ({
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
        ...contactImport.propertiesMap.tagIds,
      ]

      const totalBatches = Math.ceil(rows.length / chunkSize)

      for (let i = 0; i < rows.length; i += chunkSize) {
        const batch = rows.slice(i, i + chunkSize)

        logger.info(
          `Processing ${chunkSize} contacts in batch ${i} of ${batch.length}.`
        )

        const allContactProperties: ContactProperty[] = []

        const values = batch.map((row) => {
          const contactId = cuid()

          const customProperties =
            contactImport.propertiesMap.customProperties ?? {}

          for (const csvColumnHeaderName of Object.keys(customProperties)) {
            const property = customProperties[csvColumnHeaderName]
            const value = row[csvColumnHeaderName]

            if (property && value) {
              const date =
                property.type === "date" ? DateTime.fromISO(value) : null

              allContactProperties.push({
                id: cuid(),
                contactId,
                name: property.id,
                audienceId: contactImport.audienceId,
                boolean: null,
                float:
                  property.type === "float" ? Number.parseFloat(value) : null,
                date: date?.isValid ? date.toJSDate() : null,
                text: property.type === "text" ? value : null,
              })
            }
          }

          return {
            id: contactId,
            email: row[contactImport.propertiesMap.email],
            firstName: contactImport.propertiesMap.firstName
              ? row[contactImport.propertiesMap.firstName]
              : undefined,
            lastName: contactImport.propertiesMap.lastName
              ? row[contactImport.propertiesMap.lastName]
              : undefined,
            subscribedAt: contactImport.subscribeAllContacts
              ? DateTime.now().toJSDate()
              : undefined,
            audienceId: contactImport.audienceId,
            contactImportId: payload.contactImportId,
          }
        })

        logger.info(`Created ${values.length} contact values.`)

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

        logger.info(
          `Inserted ${createdContacts.length} contacts into database.`
        )

        for (let z = 0; z < allContactProperties.length; z += chunkSize) {
          const contactPropertiesBatch = allContactProperties.slice(
            z,
            z + chunkSize
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

        const attachTagsToContacts = tagIdsToAttachToContacts.flatMap((tagId) =>
          contactIds.map((contactId) => ({
            contactId,
            tagId,
            assignedAt: new Date(),
          }))
        )

        if (attachTagsToContacts.length > 0) {
          for (let t = 0; t < attachTagsToContacts.length; t += chunkSize) {
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
