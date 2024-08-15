import { BaseJob, type JobContext } from '@/shared/queue/abstract_job.js'
import { AVAILABLE_QUEUES } from '@/shared/queue/config.js'
import { AutomationsQueue } from '@/shared/queue/queue.js'
import { Paginator } from '@/shared/utils/pagination/paginator.ts'
import { GetMailerAction } from '@/teams/actions/mailers/get_mailer_action.js'
import { TeamRepository } from '@/teams/repositories/team_repository.js'
import {
  automationSteps,
  contactAutomationSteps,
  contacts,
} from '@/database/schema/schema.ts'
import { Contact } from '@/database/schema/types.ts'
import { container } from '@/utils/typi.js'
import { and, eq, inArray, isNotNull, isNull, sql } from 'drizzle-orm'
import { RunAutomationStepForContactJob } from './run_automation_step_for_contact_job.ts'

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
      return this.fail(
        `Automation step not found with id ${payload.automationStepId}`,
      )
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
            sql`${contacts.id} = ${contactAutomationSteps.contactId} AND ${contactAutomationSteps.automationStepId} = ${automationStep.id}`,
          ),
        )
        .queryConditions([
          and(
            isNotNull(contactAutomationSteps.id),
            eq(contactAutomationSteps.status, 'PENDING'),
          ),
        ])
        .next()

      await AutomationsQueue.addBulk(
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
}
