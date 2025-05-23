import { and, eq, isNotNull } from 'drizzle-orm'

import { SegmentBuilder } from '#root/core/audiences/utils/segment_builder/segment_builder.js'

import { RunAutomationStepForContactJob } from '#root/core/automations/jobs/run_automation_step_for_contact_job.js'
import type {
  AutomationStepRunnerContext,
  AutomationStepRunnerContract,
} from '#root/core/automations/utils/automation_step_runners/automation_runner_contract.js'

import type {
  Audience,
  AutomationStep,
  Contact,
} from '#root/database/database_schema_types.js'
import { automationSteps, contacts } from '#root/database/schema.js'

import { Queue } from '#root/core/shared/queue/queue.js'

/**
 * Implements the IF/ELSE conditional logic in automation workflows.
 *
 * This class is a cornerstone of Kibamail's automation system, enabling conditional branching
 * based on contact properties and behaviors. It evaluates whether a contact matches specified
 * criteria and routes them to the appropriate branch of the automation workflow.
 *
 * The conditional logic leverages the same powerful segmentation engine used for audience targeting,
 * allowing for complex conditions such as:
 * - Engagement-based conditions (opened/clicked emails)
 * - Property-based conditions (location, custom fields)
 * - Tag-based conditions
 * - Timing-based conditions
 *
 * This enables sophisticated automation workflows like:
 * - Re-engagement sequences that vary based on previous engagement
 * - Location-specific content delivery
 * - Personalized onboarding based on user attributes
 */
export class AddTagAutomationStepRunner implements AutomationStepRunnerContract {
  constructor(
    private automationStep: AutomationStep,
    private contact: Contact,
    private audience: Audience,
  ) {}

  /**
   * Evaluates the contact against the configured conditions and routes to the appropriate branch.
   *
   * This method implements the core conditional logic of the automation system:
   * 1. Retrieves the YES and NO branches connected to this step
   * 2. Parses the filter conditions from the step configuration
   * 3. Uses the SegmentBuilder to evaluate if the contact matches the conditions
   * 4. Queues the next automation step in either the YES or NO branch
   *
   * The system uses database queries with the SegmentBuilder to evaluate conditions,
   * ensuring consistent behavior between segment targeting and automation conditions.
   * This approach also allows for complex nested conditions with AND/OR logic.
   */
  async run({ database }: AutomationStepRunnerContext) {
    const configuration = this.automationStep.configuration as {
      filterGroups: string
    }

    // Retrieve the YES and NO branches connected to this conditional step
    // The branches are identified by their branchIndex:
    // - branchIndex 1 = YES branch (contact matches conditions)
    // - branchIndex 0 = NO branch (contact doesn't match conditions)
    //
    // This query finds all child steps that have a branch index set,
    // which identifies them as direct branches of this conditional
    const automationStepBranches = await database.query.automationSteps.findMany({
      where: and(
        eq(automationSteps.parentId, this.automationStep.id),
        isNotNull(automationSteps.branchIndex),
      ),
    })

    // Find the YES branch (branchIndex = 1)
    const yesBranch = automationStepBranches.find((branch) => branch.branchIndex === 1)

    // Find the NO branch (branchIndex = 0)
    // Note: This was previously a bug where both branches used the same index
    const noBranch = automationStepBranches.find((branch) => branch.branchIndex === 0)

    if (!yesBranch) {
      // user did not define anything on the yes branch, we halt automation
      return
    }

    if (!noBranch) {
      // user did not define anything on the no branch, we halt automation
      return
    }

    // Parse the filter conditions from JSON string into a structured object
    // These conditions define what criteria the contact must meet to follow the YES branch
    // The format matches the segment builder's filter groups structure for consistency
    const filterGroups = JSON.parse(configuration.filterGroups)

    // Evaluate whether the contact matches the conditions using the SegmentBuilder
    // This leverages the same powerful segmentation engine used for audience targeting,
    // ensuring consistent behavior between segments and automation conditions
    //
    // The query combines two conditions:
    // 1. The contact ID must match our current contact
    // 2. The contact must satisfy all the conditions in the filter groups
    //
    // If a matching record is found, the contact matches the conditions
    const [contactMatchesConditions] = await database
      .select({ id: contacts.id })
      .from(contacts)
      .where(
        and(
          eq(contacts.id, this.contact.id),
          new SegmentBuilder(filterGroups, this.audience).build(),
        ),
      )
      .limit(1)

    // If the contact matches the conditions and there's a YES branch defined,
    // queue the next step in the YES branch for this contact
    //
    // This asynchronous approach allows the automation to process many contacts
    // efficiently without blocking, as each step is processed as a separate job
    if (contactMatchesConditions && yesBranch) {
      await Queue.automations().add(RunAutomationStepForContactJob.id, {
        automationStepId: yesBranch.id,
        contactId: this.contact.id,
      })
    }

    // If the contact doesn't match the conditions and there's a NO branch defined,
    // queue the next step in the NO branch for this contact
    //
    // This ensures contacts who don't meet the criteria still continue through
    // the appropriate path in the automation workflow
    if (!contactMatchesConditions && noBranch) {
      await Queue.automations().add(RunAutomationStepForContactJob.id, {
        automationStepId: noBranch.id,
        contactId: this.contact.id,
      })
    }
  }
}
