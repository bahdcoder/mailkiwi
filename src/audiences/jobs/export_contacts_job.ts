import { makeMinioClient } from "@/minio/minio_client.ts"
import { sentenceCase } from "change-case"
import { stringify as csvStringify } from "csv-stringify"
import { and } from "drizzle-orm"
import { DateTime } from "luxon"
import { Readable } from "stream"

import { CreateContactExportDto } from "@/audiences/dto/contact_exports/create_contact_export_dto.ts"
import { SegmentBuilder } from "@/audiences/utils/segment_builder/segment_builder.ts"

import { UserRepository } from "@/auth/users/repositories/user_repository.ts"

import { Contact } from "@/database/schema/database_schema_types.ts"
import { contacts } from "@/database/schema/schema.ts"

import { makeEnv } from "@/shared/container/index.ts"
import { Mailer } from "@/shared/mailers/mailer.ts"
import { BaseJob, type JobContext } from "@/shared/queue/abstract_job.js"
import { AVAILABLE_QUEUES } from "@/shared/queue/config.js"
import { cuid } from "@/shared/utils/cuid/cuid.ts"

import { container } from "@/utils/typi.ts"

export interface ExportContactsJobPayload {
  filterGroups: CreateContactExportDto["filterGroups"]
  exportCreatedBy: number
}

export class ExportContactsJob extends BaseJob<ExportContactsJobPayload> {
  static get id() {
    return "ACCOUNTS::CONTACTS"
  }

  private HOURS_TO_EXPIRATION = 24

  static get queue() {
    return AVAILABLE_QUEUES.contacts
  }

  private databaseColumnsToCsvHeaders() {
    return [
      {
        field: "firstName",
        formatter(value: string) {
          return value
        },
      },
      {
        field: "lastName",
        formatter(value: string) {
          return value
        },
      },
      {
        field: "email",
        formatter(value: string) {
          return value
        },
      },
      {
        field: "subscribedAt",
        formatter(value: Date) {
          return DateTime.fromJSDate(value).toFormat("yyyy-mm-dd hh:mm:ss")
        },
      },
    ]
  }

  private prepareContactsToCsv(contactsToExport: Contact[]) {
    return contactsToExport.map((contact: Record<string, any>) => {
      const fields: Record<string, any> = {}
      this.databaseColumnsToCsvHeaders().forEach(
        ({ field, formatter }) => {
          fields[sentenceCase(field)] = formatter(contact[field])
        },
      )

      return fields
    })
  }

  async handle({
    database,
    payload,
  }: JobContext<ExportContactsJobPayload>) {
    const env = makeEnv()
    const filteredContacts = await database
      .select()
      .from(contacts)
      .where(and(new SegmentBuilder(payload.filterGroups).build()))

    const readableCsvStream = Readable.from(
      this.prepareContactsToCsv(filteredContacts),
    )

    const fileStream = csvStringify({
      header: true,
    })

    const minio = makeMinioClient()
      .bucket("contacts")
      .metadata({
        "x-amz-expiration": DateTime.now()
          .plus({ hours: this.HOURS_TO_EXPIRATION })
          .toISO(),
      })
      .name("exports" + "/" + cuid() + ".csv")

    await minio.write(readableCsvStream.pipe(fileStream))

    const downloadUrl = await minio.presignedUrl(
      this.HOURS_TO_EXPIRATION * 60 * 60,
    )

    const user = await container
      .make(UserRepository)
      .findById(payload.exportCreatedBy)

    if (!user) {
      return this.fail(
        `Generated report, but could not find user to deliver to.`,
      )
    }

    await Mailer.from(env.SMTP_MAIL_FROM)
      .to(user.email)
      .subject("Your contacts export is ready.")
      .content(
        JSON.stringify({
          transactionalEmailId: "transactionalEmailId",
          variables: {
            downloadUrl,
          },
        }),
      )
      .send()

    return this.done()
  }

  async failed({ payload }: JobContext<ExportContactsJobPayload>) {}
}
