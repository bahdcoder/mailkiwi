import { makeMinioClient } from "@/minio/minio_client.ts"
import CsvParser from "csv-parser"
import { sql } from "drizzle-orm"
import { DateTime } from "luxon"

import { ContactImportRepository } from "@/audiences/repositories/contact_import_repository.ts"
import { ContactRepository } from "@/audiences/repositories/contact_repository.ts"
import { TagRepository } from "@/audiences/repositories/tag_repository.ts"

import { contacts, tagsOnContacts } from "@/database/schema/schema.ts"

import { makeEnv } from "@/shared/container/index.ts"
import { BaseJob, type JobContext } from "@/shared/queue/abstract_job.js"
import { AVAILABLE_QUEUES } from "@/shared/queue/config.js"

import { container } from "@/utils/typi.ts"

export interface ImportContactsJobPayload {
  contactImportId: number
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

    const chunkSize = 1000

    await database.transaction(async (tx) => {
      // bulk insert all new tags
      const tagsToCreate = contactImport.attributesMap.tags.map((tag) => ({
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

        const values = batch.map((row) => {
          const attributes: Record<string, string> = {}

          for (const attribute of contactImport.attributesMap.attributes) {
            attributes[attribute] = row[attribute]
          }

          return {
            email: row[contactImport.attributesMap.email],
            firstName: row[contactImport.attributesMap.firstName],
            lastName: row[contactImport.attributesMap.lastName],
            attributes,
            subscribedAt: contactImport.subscribeAllContacts
              ? DateTime.now().toJSDate()
              : undefined,
            audienceId: contactImport.audienceId,
          }
        })

        const createdContacts = await container
          .make(ContactRepository)
          .transaction(tx)
          .bulkCreate(values, {
            set: contactImport.updateExistingContacts
              ? {
                  firstName: sql`values(${contacts.firstName})`,
                  lastName: sql`values(${contacts.lastName})`,
                  attributes: sql`values(${contacts.attributes})`,
                  email: sql`${contacts.email}`, // no change
                }
              : {},
          })

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

    const env = makeEnv()

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
