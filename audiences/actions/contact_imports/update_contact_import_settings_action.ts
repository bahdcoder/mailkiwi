import { UpdateContactImportSettingsDto } from "@/audiences/dto/contact_imports/update_contact_import_settings_dto.js"
import { ImportContactsJob } from "@/audiences/jobs/import_contacts_job.js"
import { AudienceRepository } from "@/audiences/repositories/audience_repository.js"
import { ContactImportRepository } from "@/audiences/repositories/contact_import_repository.js"

import { ContactImport } from "@/database/database_schema_types.js"

import { E_VALIDATION_FAILED } from "@/http/responses/errors.js"

import { makeDatabase } from "@/shared/container/index.js"
import { Queue } from "@/shared/queue/queue.js"

import { container } from "@/utils/typi.js"

export class UpdateContactImportSettingsAction {
  constructor(
    protected contactImportRepository = container.make(ContactImportRepository),
    protected audienceRepository = container.make(AudienceRepository),
    protected database = makeDatabase(),
  ) {}

  handle = async (
    contactImport: ContactImport,
    payload: UpdateContactImportSettingsDto,
  ) => {
    const headers = contactImport.propertiesMap.headers

    this.validateAttributes(payload, contactImport.propertiesMap.headers)

    await this.database.transaction(async (trx) => {
      await this.contactImportRepository.transaction(trx).update(contactImport.id, {
        status: "PROCESSING",
        subscribeAllContacts:
          payload.subscribeAllContacts === undefined
            ? true
            : payload.subscribeAllContacts,
        updateExistingContacts:
          payload.updateExistingContacts === undefined
            ? true
            : payload.updateExistingContacts,
        propertiesMap: {
          ...payload.propertiesMap,
          headers,
          tagIds: payload.tagIds ?? [],
          tags: payload.tags ?? [],
        },
      })

      await this.audienceRepository
        .transaction(trx)
        .updateKnownProperties(
          contactImport.audienceId,
          Object.values(payload.propertiesMap.customProperties ?? {}),
        )
    })

    await Queue.contacts().add(ImportContactsJob.id, {
      contactImportId: contactImport.id,
    })

    return { id: contactImport.id }
  }

  private validateAttributes(payload: UpdateContactImportSettingsDto, headers: string[]) {
    const headersFromPayload: string[] = [
      payload.propertiesMap.email,
      payload.propertiesMap.firstName,
      payload.propertiesMap.lastName,
      ...Object.keys(payload.propertiesMap.customProperties ?? {}),
    ]

    const headersSet = new Set(headers)
    const headersAreValid = headersFromPayload.every((element) => headersSet.has(element))

    if (!headersAreValid) {
      throw E_VALIDATION_FAILED([
        {
          message:
            "Invalid headers were provided. Please make sure the headers match the values in the uploaded CSV.",
          field: "propertiesMap",
        },
      ])
    }
  }
}
