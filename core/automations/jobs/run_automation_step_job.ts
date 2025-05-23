import { and, eq, isNotNull, sql } from 'drizzle-orm'
import { RunAutomationStepForContactJob } from './run_automation_step_for_contact_job.js'

import type { Contact } from '#root/database/database_schema_types.js'
import {
  automationSteps,
  contactAutomationSteps,
  contacts,
  uuidToBin,
} from '#root/database/schema.js'

import { BaseJob, type JobContext } from '#root/core/shared/queue/abstract_job.js'
import { AVAILABLE_QUEUES } from '#root/core/shared/queue/config.js'
import { Queue } from '#root/core/shared/queue/queue.js'
import { Paginator } from '#root/core/shared/utils/pagination/paginator.js'

export interface RunAutomationStepJobPayload {
  automationStepId: string
}

export class RunAutomationStepJob extends BaseJob<RunAutomationStepJobPayload> {
  static get id() {
    return 'AUTOMATIONS::RUN_AUTOMATION_STEP'
  }

  static get queue() {
    return AVAILABLE_QUEUES.automations
  }

  async handle({ database, payload }: JobContext<RunAutomationStepJobPayload>) {
    // fetch the automation step alongside the automation.
    const automationStep = await database.query.automationSteps.findFirst({
      where: eq(automationSteps.id, payload.automationStepId),
    })

    if (!automationStep) {
      return this.fail(`Automation step not found with id ${payload.automationStepId}`)
    }
    // fetch all contacts currently at that step, or have completed the previous step

    const batchSize = 75

    let cursor: string | undefined = undefined
    let finishedGoingThroughCursor = false

    while (finishedGoingThroughCursor === false) {
      const { data, next } = await new Paginator<Contact>(contacts)
        .size(batchSize)
        .select({ id: contacts.id })
        .cursor(cursor)
        .field(contacts.id)
        .modifyQuery((query) =>
          query.leftJoin(
            contactAutomationSteps,
            sql`${contacts.id} = ${contactAutomationSteps.contactId} AND ${contactAutomationSteps.automationStepId} = ${uuidToBin(automationStep.id)}`,
          ),
        )
        .queryConditions([
          and(
            isNotNull(contactAutomationSteps.id),
            eq(contactAutomationSteps.status, 'PENDING'),
          ),
        ])
        .next()

      await Queue.automations().addBulk(
        data.map((contact) => ({
          name: RunAutomationStepForContactJob.id,
          data: {
            contactId: contact.id,
          },
          opts: { attempts: 3 },
        })),
      )

      if (!next) {
        finishedGoingThroughCursor = true
      }

      cursor = next
    }

    return this.done()
  }

  async failed() {}
}
