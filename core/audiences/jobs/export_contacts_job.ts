import { Readable } from 'node:stream'
import { appEnv } from '#root/core/app/env/app_env.js'
import { makeMinioClient } from '#root/core/minio/minio_client.js'
import { sentenceCase } from 'change-case'
import { stringify as csvStringify } from 'csv-stringify'
import { and, eq } from 'drizzle-orm'
import { DateTime } from 'luxon'

import type { CreateContactExportDto } from '#root/core/audiences/dto/contact_exports/create_contact_export_dto.js'
import { AudienceRepository } from '#root/core/audiences/repositories/audience_repository.js'
import { ContactRepository } from '#root/core/audiences/repositories/contact_repository.js'
import { SegmentBuilder } from '#root/core/audiences/utils/segment_builder/segment_builder.js'

import { UserRepository } from '#root/core/auth/users/repositories/user_repository.js'

import type {
  Audience,
  Contact,
  ContactWithTags,
} from '#root/database/database_schema_types.js'
import { contacts } from '#root/database/schema.js'

import { Mailer } from '#root/core/shared/mailers/mailer.js'
import { BaseJob, type JobContext } from '#root/core/shared/queue/abstract_job.js'
import { AVAILABLE_QUEUES } from '#root/core/shared/queue/config.js'
import { cuid } from '#root/core/shared/utils/cuid/cuid.js'

import { container } from '#root/core/utils/typi.js'

export interface ExportContactsJobPayload {
  filterGroups: CreateContactExportDto['filterGroups']
  audienceId: string
  exportCreatedBy: string
}

export class ExportContactsJob extends BaseJob<ExportContactsJobPayload> {
  static get id() {
    return 'ACCOUNTS::CONTACTS'
  }

  private HOURS_TO_EXPIRATION = 24

  static get queue() {
    return AVAILABLE_QUEUES.contacts
  }

  private databaseColumnsToCsvHeaders(audience: Audience) {
    return [
      {
        field: { name: 'firstName', type: 'text' },
        formatter(value: string) {
          return value
        },
        isAttribute: false,
      },
      {
        field: { name: 'lastName', type: 'text' },
        formatter(value: string) {
          return value
        },
        isAttribute: false,
      },
      {
        field: { name: 'email', type: 'text' },
        formatter(value: string) {
          return value
        },
        isAttribute: false,
      },
      {
        field: { name: 'subscribedAt', type: 'date' },
        formatter(value: string) {
          return DateTime.fromJSDate(new Date(value)).toFormat('yyyy-mm-dd hh:mm:ss')
        },
        isAttribute: false,
      },
      ...(audience.knownProperties ?? []).map((attributeKey) => ({
        field: { name: attributeKey.label, type: attributeKey.type },
        formatter(value: string) {
          return value
        },
        isAttribute: true,
      })),
    ]
  }

  private prepareContactsToCsv(contactsToExport: ContactWithTags[], audience: Audience) {
    return contactsToExport.map((contact) => {
      const fields: Record<string, string> = {}

      for (const { field, formatter, isAttribute } of this.databaseColumnsToCsvHeaders(
        audience,
      )) {
        if (isAttribute) {
          fields[field.name] = formatter(contact?.attributes?.[field.name] as string)
        } else {
          const contactProperties = contact as unknown as Record<string, string>
          fields[sentenceCase(field.name)] = formatter(contactProperties[field.name])
        }
      }

      fields.Tags = contact.tags
        ?.map((tag: { tag: { name: string } }) => tag.tag.name)
        .join(',')

      return fields
    })
  }

  async handle({ payload }: JobContext<ExportContactsJobPayload>) {
    const audience = await container.make(AudienceRepository).findById(payload.audienceId)

    const filteredContacts = await container
      .make(ContactRepository)
      .findAllContactsWithTags(
        and(
          new SegmentBuilder(payload.filterGroups, audience).build(),
          eq(contacts.audienceId, payload.audienceId),
        ),
      )

    if (filteredContacts.length === 0) {
      return this.done('No contacts to export.')
    }

    if (!audience) {
      return this.fail('The audience could not be found.')
    }

    const readableCsvStream = Readable.from(
      this.prepareContactsToCsv(filteredContacts, audience),
    )

    const fileStream = csvStringify({
      header: true,
    })

    const minio = makeMinioClient()
      .bucket('contacts')
      .metadata({
        'x-amz-expiration': DateTime.now()
          .plus({ hours: this.HOURS_TO_EXPIRATION })
          .toISO(),
      })
      .name(`exports/${cuid()}.csv`)

    await minio.write(readableCsvStream.pipe(fileStream))

    const downloadUrl = await minio.presignedUrl(this.HOURS_TO_EXPIRATION * 60 * 60)

    const user = await container.make(UserRepository).findById(payload.exportCreatedBy)

    if (!user) {
      return this.fail('Generated report, but could not find user to deliver to.')
    }

    await Mailer.from(appEnv.SMTP_MAIL_FROM)
      .to(user.email)
      .subject('Your contacts export is ready.')
      .content(
        JSON.stringify({
          transactionalEmailId: 'transactionalEmailId',
          variables: {
            downloadUrl,
          },
        }),
      )
      .send()

    return this.done()
  }

  async failed(_: JobContext<ExportContactsJobPayload>) {}
}
