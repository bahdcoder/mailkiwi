import type { AutomationStep, Contact } from '@/database/schema/types.js'
import type {
  AutomationStepRunnerContract,
  AutomationStepRunnerContext,
} from '@/automations/utils/automation_step_runners/automation_runner_contract.js'
import {
  automationSteps,
  contacts,
  type RULE_IF_ELSE_CONFIGURATION,
} from '@/database/schema/schema.ts'
import { and, eq, isNotNull } from 'drizzle-orm'
import { SegmentBuilder } from '@/audiences/utils/segment_builder/segment_builder.ts'
import { AutomationsQueue } from '@/shared/queue/queue.ts'
import { RunAutomationStepForContactJob } from '@/automations/jobs/run_automation_step_for_contact_job.ts'

export class AddTagAutomationStepRunner
  implements AutomationStepRunnerContract
{
  constructor(
    private automationStep: AutomationStep,
    private contact: Contact,
  ) {}

  async run({ database }: AutomationStepRunnerContext) {
    const configuration = this.automationStep
      .configuration as RULE_IF_ELSE_CONFIGURATION

    // if / else has 2 branches.
    const automationStepBranches =
      await database.query.automationSteps.findMany({
        where: and(
          eq(automationSteps.parentId, this.automationStep.id),
          isNotNull(automationSteps.branchIndex),
        ),
      })

    const yesBranch = automationStepBranches.find(
      (branch) => branch.branchIndex === 0,
    )

    const noBranch = automationStepBranches.find(
      (branch) => branch.branchIndex === 0,
    )

    if (!yesBranch) {
      // user did not define anything on the yes branch, we halt automation
    }

    if (!noBranch) {
      // user did not define anything on the no branch, we halt automation
    }

    const [contactMatchesConditions] = await database
      .select({ id: contacts.id })
      .from(contacts)
      .where(
        and(
          eq(contacts.id, this.contact.id),
          new SegmentBuilder(configuration.conditions).build(),
        ),
      )
      .limit(1)

    if (contactMatchesConditions && yesBranch) {
      await AutomationsQueue.add(RunAutomationStepForContactJob.id, {
        automationStepId: yesBranch.id,
        contactId: this.contact.id,
      })
    }

    if (!contactMatchesConditions && noBranch) {
      await AutomationsQueue.add(RunAutomationStepForContactJob.id, {
        automationStepId: noBranch.id,
        contactId: this.contact.id,
      })
    }
  }
}
