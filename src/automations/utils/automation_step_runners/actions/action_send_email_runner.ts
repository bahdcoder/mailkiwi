import { EmailRepository } from "@/emails/repositories/email_repository.ts"
import { eq } from "drizzle-orm"

import type {
  AutomationStepRunnerContext,
  AutomationStepRunnerContract,
} from "@/automations/utils/automation_step_runners/automation_runner_contract.js"

import type {
  AutomationStep,
  Contact,
  ValidatedEmailContent,
} from "@/database/schema/database_schema_types.js"
import {
  type ACTION_SEND_EMAIL_CONFIGURATION,
  emails,
} from "@/database/schema/schema.ts"

import { Mailer } from "@/shared/mailers/mailer.ts"

import { container } from "@/utils/typi.ts"

export class SendEmailAutomationStepRunner
  implements AutomationStepRunnerContract
{
  constructor(
    private automationStep: AutomationStep,
    private contact: Contact,
  ) {}

  async run({ redis }: AutomationStepRunnerContext) {
    const configuration = this.automationStep
      .configuration as ACTION_SEND_EMAIL_CONFIGURATION

    const email = await container
      .make(EmailRepository)
      .findById(configuration.emailId)

    // Email might have been deleted. Do nothing.
    if (!email || !email?.emailContent) {
      return
    }

    const { fromEmail, fromName, contentHtml, contentText, subject } =
      email.emailContent as ValidatedEmailContent

    const [response, error] = await Mailer.from(fromEmail, fromName)
      .to(
        this.contact.email,
        `${this.contact.firstName} ${this.contact.lastName}`,
      )
      .subject(subject)
      .content(contentHtml, contentText)
      .send()

    if (error) throw error

    await redis.set(
      response.messageId,
      `AUTOMATION_STEP:${this.automationStep.id}:${this.contact.id}`,
    )
  }
}
