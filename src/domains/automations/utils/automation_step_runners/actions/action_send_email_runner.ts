import type {
  AutomationStep,
  Contact,
  ValidatedEmailContent,
} from '@/infrastructure/database/schema/types.js'
import type {
  AutomationStepRunnerContract,
  AutomationStepRunnerContext,
} from '@/domains/automations/utils/automation_step_runners/automation_runner_contract.js'

import {
  type ACTION_SEND_EMAIL_CONFIGURATION,
  emails,
  sends,
} from '@/infrastructure/database/schema/schema.ts'
import { eq } from 'drizzle-orm'
import { Mailer } from '@/domains/shared/mailers/mailer.ts'

export class SendEmailAutomationStepRunner
  implements AutomationStepRunnerContract
{
  constructor(
    private automationStep: AutomationStep,
    private contact: Contact,
  ) {}

  async run({ database }: AutomationStepRunnerContext) {
    const configuration = this.automationStep
      .configuration as ACTION_SEND_EMAIL_CONFIGURATION

    const email = await database.query.emails.findFirst({
      where: eq(emails.id, configuration.emailId),
      with: {
        emailContent: true,
      },
    })

    // Email might have been deleted. Do nothing.
    if (!email || !email.emailContent) {
      return
    }

    const { fromEmail, fromName, contentHtml, contentText, subject } =
      email.emailContent as ValidatedEmailContent

    const [{ messageId }, error] = await Mailer.from(fromEmail, fromName)
      .to(
        this.contact.email,
        `${this.contact.firstName} ${this.contact.lastName}`,
      )
      .subject(subject)
      .content(contentHtml, contentText)
      .send()

    if (error) throw error

    await database.insert(sends).values({
      type: 'AUTOMATION',
      messageId,
      automationStepId: this.automationStep.id,
      status: 'SENT',
      contactId: this.contact.id,
      sentAt: new Date(),
    })
  }
}
