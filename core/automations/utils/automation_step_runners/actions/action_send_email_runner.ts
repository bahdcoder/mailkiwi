import { EmailRepository } from '#root/core/emails/repositories/email_repository.js'
import { eq } from 'drizzle-orm'

import type {
  AutomationStepRunnerContext,
  AutomationStepRunnerContract,
} from '#root/core/automations/utils/automation_step_runners/automation_runner_contract.js'

import type {
  AutomationStep,
  Contact,
  ValidatedEmailContent,
} from '#root/database/database_schema_types.js'
import { type ACTION_SEND_EMAIL_CONFIGURATION, emails } from '#root/database/schema.js'

import { Mailer } from '#root/core/shared/mailers/mailer.js'
import { SenderIdentityRepository } from '#root/core/sending_domains/repositories/sender_identity_repository.js'
import { SendingDomainRepository } from '#root/core/sending_domains/repositories/sending_domain_repository.js'

import { container } from '#root/core/utils/typi.js'
import { E_OPERATION_FAILED } from '#root/core/http/responses/errors.js'

/**
 * SendEmailAutomationStepRunner handles the "Send Email" action in automation workflows.
 *
 * This class is responsible for sending personalized transactional emails to contacts
 * as part of an automation workflow. It's a key component in Kibamail's marketing
 * automation system, enabling use cases such as:
 *
 * - Welcome email sequences for new subscribers
 * - Abandoned cart recovery emails
 * - Re-engagement campaigns for inactive users
 * - Educational drip campaigns
 * - Follow-up emails after specific user actions
 *
 * The runner retrieves the email template configured for this automation step,
 * personalizes it for the specific contact, and sends it using the Mailer service.
 * It also records the message ID in Redis to enable tracking of email engagement
 * metrics (opens, clicks) back to the specific automation step that triggered the email.
 */
export class SendEmailAutomationStepRunner implements AutomationStepRunnerContract {
  constructor(
    private automationStep: AutomationStep,
    private contact: Contact,
  ) {}

  /**
   * Executes the "Send Email" automation step for a specific contact.
   *
   * This method implements the email sending process for automation workflows:
   * 1. Retrieves the email template configured for this automation step
   * 2. Extracts the email content, subject, and sender information
   * 3. Personalizes the email for the specific contact
   * 4. Sends the email using the Mailer service
   * 5. Records the message ID in Redis to track engagement back to this automation step
   *
   * The method includes error handling for cases where the email template has been
   * deleted or is otherwise unavailable. In such cases, the automation continues
   * without sending an email to avoid breaking the entire workflow.
   *
   * @param context - The execution context containing Redis connection
   * @throws Error if the email sending fails
   */
  async run({ redis }: AutomationStepRunnerContext) {
    const configuration = this.automationStep
      .configuration as ACTION_SEND_EMAIL_CONFIGURATION

    const email = await container.make(EmailRepository).findById(configuration.emailId)

    // If the email template has been deleted since the automation was configured,
    // gracefully skip this step rather than failing the entire automation.
    // This ensures that automations remain robust even if their components change.
    if (!email || !email?.emailContent) {
      return
    }

    const { contentHtml, contentText, subject } =
      email.emailContent as ValidatedEmailContent

    const senderIdentity = await container
      .make(SenderIdentityRepository)
      .findById(email.senderIdentityId as string)

    if (!senderIdentity) {
      throw E_OPERATION_FAILED('No sender identity found for this email')
    }

    const sendingDomain = await container
      .make(SendingDomainRepository)
      .findById(senderIdentity.sendingDomainId)

    if (!sendingDomain) {
      throw E_OPERATION_FAILED('No sending domain found for this sender identity')
    }

    const fromEmail = `${senderIdentity.email}@${sendingDomain.name}`
    const fromName = senderIdentity.name

    const [response, error] = await Mailer.from(fromEmail, fromName)
      .to(this.contact.email, `${this.contact.firstName} ${this.contact.lastName}`)
      .subject(subject)
      .content(contentHtml, contentText)
      .send()

    if (error) throw error

    // Store the message ID in Redis with a reference to this automation step and contact.
    // This mapping enables the system to track email engagement events (opens, clicks)
    // back to the specific automation step that triggered the email, allowing for:
    // - Detailed reporting on automation performance
    // - Triggering subsequent automation steps based on email engagement
    // - A/B testing of different email templates in automation workflows
    await redis.set(
      response.messageId,
      `AUTOMATION_STEP:${this.automationStep.id}:${this.contact.id}`,
    )
  }
}
