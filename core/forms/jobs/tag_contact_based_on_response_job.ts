import { FormRepository } from '#root/core/forms/repositories/form_repository.js'
import { FormResponseRepository } from '#root/core/forms/repositories/form_response_repository.js'

import { ContactRepository } from '#root/core/audiences/repositories/contact_repository.js'

import { BaseJob, type JobContext } from '#root/core/shared/queue/abstract_job.js'
import { AVAILABLE_QUEUES } from '#root/core/shared/queue/config.js'

import { container } from '#root/core/utils/typi.js'

export interface TagContactBasedOnResponseJobPayload {
  formResponseId: string
}

export class TagContactBasedOnResponseJob extends BaseJob<TagContactBasedOnResponseJobPayload> {
  static get id() {
    return 'CONTACTS::TAG_CONTACT_BASED_ON_RESPONSE'
  }

  static get queue() {
    return AVAILABLE_QUEUES.contacts
  }

  async handle({ payload, database }: JobContext<TagContactBasedOnResponseJobPayload>) {
    const formResponse = await container
      .make(FormResponseRepository)
      .responses()
      .findById(payload.formResponseId)

    if (!formResponse) {
      return this.done(
        'Form response not found. Might have been deleted before this job ran.',
      )
    }

    if (!formResponse.contactId) {
      return this.done('Form response is not associated with a contactId.')
    }

    const form = await container
      .make(FormRepository)
      .forms()
      .findById(formResponse.formId)

    const fields = form.fields?.filter(
      (field) => field.autoTagging && field.autoTagging.length > 0,
    )

    if (!fields || fields.length === 0) {
      return this.done('This form does not have any fields with auto tagging enabled.')
    }

    await database.transaction(async (trx) => {
      for (const field of fields) {
        if (field.autoTagging) {
          for (const autoTagRule of field.autoTagging) {
            const fieldId = field.id as string

            const responseAnswer = formResponse?.response?.[fieldId]

            const ruleMatches = responseAnswer?.includes(autoTagRule.option)

            if (ruleMatches) {
              await container
                .make(ContactRepository)
                .transaction(trx)
                .attachTags(formResponse.contactId as string, autoTagRule.tagId)
            }
          }
        }
      }
    })

    return this.done()
  }

  async failed() {}
}
