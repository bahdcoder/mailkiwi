import { AddTagAutomationStepRunner } from './actions/action_add_tag_runner.js'
import { RemoveTagAutomationStepRunner } from './actions/action_remove_tag_runner.js'
import { SendEmailAutomationStepRunner } from './actions/action_send_email_runner.js'
import type {
  AutomationStepRunnerContext,
  AutomationStepRunnerContractConstructor,
} from './automation_runner_contract.js'

import type { AutomationStep, Contact } from '#root/database/database_schema_types.js'
import { contactAutomationSteps } from '#root/database/schema.js'

import { E_OPERATION_FAILED } from '#root/core/http/responses/errors.js'

/**
 * AutomationStepRunner is the central orchestrator for executing automation workflow steps.
 *
 * This class implements a factory pattern that dynamically instantiates and executes the appropriate
 * runner for each automation step type. It serves as the core execution engine for Kibamail's
 * automation system, handling the execution of various action types including:
 *
 * - Sending emails to contacts
 * - Adding/removing tags from contacts
 * - Updating contact properties
 * - Executing conditional logic
 * - Triggering external webhooks
 *
 * The runner maintains a registry of step type implementations, allowing the system to be
 * extended with new automation step types without modifying the core execution logic.
 * This extensibility is critical for the product roadmap as new automation capabilities
 * are regularly added to the platform.
 */
export class AutomationStepRunner {
  private contact: Contact

  /**
   * Registry mapping automation step subtypes to their implementation classes.
   *
   * This registry uses a factory pattern to dynamically instantiate the appropriate
   * runner for each step type. When a new automation action type is added to the system,
   * its implementation is registered here to make it available in the automation engine.
   *
   * The system currently supports these core automation actions:
   * - ACTION_ADD_TAG: Adds one or more tags to a contact
   * - ACTION_REMOVE_TAG: Removes one or more tags from a contact
   * - ACTION_SEND_EMAIL: Sends a transactional email to a contact
   *
   * Additional action types can be added by implementing the AutomationStepRunnerContract
   * interface and registering the implementation in this registry.
   */
  protected runners: Partial<
    Record<AutomationStep['subtype'], AutomationStepRunnerContractConstructor>
  > = {
    ACTION_ADD_TAG: AddTagAutomationStepRunner,
    ACTION_SEND_EMAIL: SendEmailAutomationStepRunner,
    ACTION_REMOVE_TAG: RemoveTagAutomationStepRunner,
  }

  constructor(private automationStep: AutomationStep) {}

  forContact(contact: Contact) {
    this.contact = contact

    return this
  }

  /**
   * Executes an automation step for a specific contact.
   *
   * This method is the core execution engine for automation workflows. It:
   * 1. Validates that a contact has been set for the automation
   * 2. Looks up the appropriate runner implementation for the step type
   * 3. Instantiates and executes the runner with the step configuration
   * 4. Records the step execution in the database for tracking and analytics
   *
   * The execution is transactional - if any part fails, the entire step execution
   * is rolled back to prevent partial automation execution, which could lead to
   * inconsistent contact states or duplicate actions.
   *
   * After successful execution, the system records the completion in the contactAutomationSteps
   * table, which enables:
   * - Tracking which contacts have completed which steps
   * - Analytics on automation performance and engagement
   * - Preventing duplicate execution of steps
   * - Visualizing contact progress through automation workflows
   *
   * @param context - The execution context containing database and redis connections
   * @throws E_OPERATION_FAILED if the contact is not set or the runner is not found
   */
  async run({ database, redis }: AutomationStepRunnerContext) {
    if (!this.contact) {
      throw E_OPERATION_FAILED('Contact not set for automation step runner.')
    }

    const Runner = this.runners[this.automationStep.subtype]

    if (!Runner) {
      throw E_OPERATION_FAILED(
        `Runner for automation step subtype ${this.automationStep.subtype} has not been defined.`,
      )
    }

    await new Runner(this.automationStep, this.contact).run({
      database,
      redis,
    })

    // Record the step execution in the database for tracking and analytics
    // This creates an audit trail of which contacts have completed which steps
    // and when, enabling detailed reporting on automation performance
    await database.insert(contactAutomationSteps).values({
      contactId: this.contact.id,
      automationStepId: this.automationStep.id,
      status: 'COMPLETED',
      completedAt: new Date(),
    })
  }
}
