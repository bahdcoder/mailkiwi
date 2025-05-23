import { and, eq } from 'drizzle-orm'

import { ContactRepository } from '#root/core/audiences/repositories/contact_repository.js'

import { RunAutomationForContactJob } from '#root/core/automations/jobs/run_automation_for_contact_job.js'

import type { TagOnContact } from '#root/database/database_schema_types.js'
import {
  type TRIGGER_CONFIGURATION,
  automationSteps,
  automations,
  contactAutomationSteps,
  tagsOnContacts,
} from '#root/database/schema.js'

import type { AUTOMATION_STEP_SUB_TYPES_TRIGGER } from '#root/database/types/automations.js'

import { BaseJob, type JobContext } from '#root/core/shared/queue/abstract_job.js'
import { AVAILABLE_QUEUES } from '#root/core/shared/queue/config.js'
import { Queue } from '#root/core/shared/queue/queue.js'

import { container } from '#root/core/utils/typi.js'

export interface TriggerAutomationsForContactJobPayload {
  contactId: string
  trigger: AUTOMATION_STEP_SUB_TYPES_TRIGGER
}

export class TriggerAutomationsForContactJob extends BaseJob<TriggerAutomationsForContactJobPayload> {
  static get id() {
    return 'AUTOMATIONS::TRIGGER_AUTOMATIONS_FOR_CONTACT'
  }

  static get queue() {
    return AVAILABLE_QUEUES.automations
  }

  async handle({
    payload,
    database,
  }: JobContext<TriggerAutomationsForContactJobPayload>) {
    const contact = await container.make(ContactRepository).findById(payload.contactId)

    if (!contact) {
      return this.done(`Contact with id ${payload.contactId} not found.`)
    }

    const triggers = await database
      .select()
      .from(automationSteps)
      .leftJoin(automations, eq(automations.id, automationSteps.automationId))
      .where(
        and(
          eq(automationSteps.subtype, payload.trigger),
          eq(automationSteps.status, 'ACTIVE'),
          eq(automations.audienceId, contact.audienceId),
        ),
      )

    let contactTags: TagOnContact[] = []

    if (
      payload.trigger === 'TRIGGER_CONTACT_TAG_ADDED' ||
      payload.trigger === 'TRIGGER_CONTACT_TAG_REMOVED'
    ) {
      contactTags = await database
        .select()
        .from(tagsOnContacts)
        .where(eq(tagsOnContacts.contactId, contact.id))
    }

    const contactTagIds = contactTags.map((tag) => tag.tagId)

    const triggeredAutomationSteps = await database
      .select()
      .from(contactAutomationSteps)
      .where(eq(contactAutomationSteps.contactId, contact.id))

    for (const trigger of triggers) {
      if (!trigger.automations) {
        continue
      }

      const hasCompletedTrigger = triggeredAutomationSteps.some(
        (step) => step.automationStepId === trigger.automationSteps.id,
      )

      if (hasCompletedTrigger) {
        continue
      }

      switch (trigger.automationSteps.subtype) {
        case 'TRIGGER_CONTACT_TAG_ADDED': {
          const tagAdded = contactTagIds.some((tagId) =>
            (
              trigger.automationSteps.configuration as TRIGGER_CONFIGURATION
            )?.tagIds?.includes(tagId),
          )

          if (!tagAdded) {
            continue
          }

          break
        }
        case 'TRIGGER_CONTACT_TAG_REMOVED': {
          const tagRemoved = contactTagIds.some(
            (tagId) =>
              !(
                trigger.automationSteps.configuration as TRIGGER_CONFIGURATION
              )?.tagIds?.includes(tagId),
          )

          if (!tagRemoved) {
            continue
          }

          break
        }
        default:
          break
      }

      await Queue.automations().add(RunAutomationForContactJob.id, {
        automationId: trigger.automations.id,
        contactId: contact.id,
      })
    }

    return this.done()
  }

  async failed() {}
}
