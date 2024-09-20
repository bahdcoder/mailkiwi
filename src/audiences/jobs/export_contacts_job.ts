import { apiEnv } from "@/api/env/api_env.js"
import { makeMinioClient } from "@/minio/minio_client.js"
import { sentenceCase } from "change-case"
import { stringify as csvStringify } from "csv-stringify"
import { and, eq } from "drizzle-orm"
import { DateTime } from "luxon"
import { Readable } from "stream"

import { CreateContactExportDto } from "@/audiences/dto/contact_exports/create_contact_export_dto.js"
import { AudienceRepository } from "@/audiences/repositories/audience_repository.js"
import { ContactRepository } from "@/audiences/repositories/contact_repository.js"
import { SegmentBuilder } from "@/audiences/utils/segment_builder/segment_builder.js"

import { UserRepository } from "@/auth/users/repositories/user_repository.js"

import {
  Audience,
  Contact,
} from "@/database/schema/database_schema_types.js"
import { contacts } from "@/database/schema/schema.js"

import { Mailer } from "@/shared/mailers/mailer.js"
import { BaseJob, type JobContext } from "@/shared/queue/abstract_job.js"
import { AVAILABLE_QUEUES } from "@/shared/queue/config.js"
import { cuid } from "@/shared/utils/cuid/cuid.js"

import { container } from "@/utils/typi.js"

export interface ExportContactsJobPayload {
  filterGroups: CreateContactExportDto["filterGroups"]
  audienceId: number
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

  private databaseColumnsToCsvHeaders(audience: Audience) {
    return [
      {
        field: "firstName",
        formatter(value: string) {
          return value
        },
        isAttribute: false,
      },
      {
        field: "lastName",
        formatter(value: string) {
          return value
        },
        isAttribute: false,
      },
      {
        field: "email",
        formatter(value: string) {
          return value
        },
        isAttribute: false,
      },
      {
        field: "subscribedAt",
        formatter(value: Date) {
          return DateTime.fromJSDate(value).toFormat("yyyy-mm-dd hh:mm:ss")
        },
        isAttribute: false,
      },
      ...(audience.knownAttributesKeys ?? []).map((attributeKey) => ({
        field: attributeKey,
        formatter(value: string) {
          return value
        },
        isAttribute: true,
      })),
    ]
  }

  private prepareContactsToCsv(
    contactsToExport: Contact[],
    audience: Audience,
  ) {
    return contactsToExport.map((contact: Record<string, any>) => {
      const fields: Record<string, any> = {}

      this.databaseColumnsToCsvHeaders(audience).forEach(
        ({ field, formatter, isAttribute }) => {
          if (isAttribute) {
            fields[field] = formatter(contact?.attributes?.[field])
          } else {
            fields[sentenceCase(field)] = formatter(contact[field])
          }
        },
      )

      fields["Tags"] = contact.tags
        ?.map((tag: { tag: { name: string } }) => tag.tag.name)
        .join(",")

      return fields
    })
  }

  async handle({
    database,
    payload,
  }: JobContext<ExportContactsJobPayload>) {
    const filteredContacts = await container
      .make(ContactRepository)
      .findAllContactsWithTags(
        and(
          new SegmentBuilder(payload.filterGroups).build(),
          eq(contacts.audienceId, payload.audienceId),
        ),
      )

    if (filteredContacts.length === 0) {
      return this.done("No contacts to export.")
    }

    const audience = await container
      .make(AudienceRepository)
      .findById(payload.audienceId)

    if (!audience) {
      return this.fail(`The audience could not be found.`)
    }

    const readableCsvStream = Readable.from(
      this.prepareContactsToCsv(filteredContacts, audience),
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

    await Mailer.from(apiEnv.SMTP_MAIL_FROM)
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
