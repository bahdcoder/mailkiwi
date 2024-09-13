import { UpdateContactImportSettingsDto } from "@/audiences/dto/contact_imports/update_contact_import_settings_dto.ts"
import { ImportContactsJob } from "@/audiences/jobs/import_contacts_job.ts"
import { ContactImportRepository } from "@/audiences/repositories/contact_import_repository.ts"

import { ContactImport } from "@/database/schema/database_schema_types.ts"

import { E_VALIDATION_FAILED } from "@/http/responses/errors.ts"

import { Queue } from "@/shared/queue/queue.ts"

import { container } from "@/utils/typi.js"

export class UpdateContactImportSettingsAction {
  constructor(
    private contactImportRepository = container.make(
      ContactImportRepository,
    ),
  ) {}

  handle = async (
    contactImport: ContactImport,
    payload: UpdateContactImportSettingsDto,
  ) => {
    const headers = contactImport.attributesMap.headers

    this.validateAttributes(payload, contactImport.attributesMap.headers)

    await this.contactImportRepository.update(contactImport.id, {
      status: "PROCESSING",
      subscribeAllContacts:
        payload.subscribeAllContacts === undefined
          ? true
          : payload.subscribeAllContacts,
      updateExistingContacts:
        payload.updateExistingContacts === undefined
          ? true
          : payload.updateExistingContacts,
      attributesMap: {
        ...payload.attributesMap,
        headers,
        tagIds: payload.tagIds ?? [],
        tags: payload.tags ?? [],
      },
    })

    await Queue.contacts().add(ImportContactsJob.id, {
      contactImportId: contactImport.id,
    })

    return { id: contactImport.id }
  }

  private validateAttributes(
    payload: UpdateContactImportSettingsDto,
    headers: string[],
  ) {
    const headersFromPayload: string[] = [
      payload.attributesMap.email,
      payload.attributesMap.firstName,
      payload.attributesMap.lastName,
      ...payload.attributesMap.attributes,
    ]

    const headersSet = new Set(headers)
    const headersAreValid = headersFromPayload.every((element) =>
      headersSet.has(element),
    )

    if (!headersAreValid) {
      throw E_VALIDATION_FAILED([
        {
          message:
            "Invalid headers were provided. Please make sure the headers match the values in the uploaded CSV.",
          field: "attributesMap",
        },
      ])
    }
  }
}
