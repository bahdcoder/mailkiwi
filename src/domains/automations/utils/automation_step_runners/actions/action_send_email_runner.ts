import type {
  AutomationStep,
  Contact,
} from '@/infrastructure/database/schema/types.js'
import type {
  AutomationStepRunnerContract,
  AutomationStepRunnerContext,
} from '@/domains/automations/utils/automation_step_runners/automation_runner_contract.js'

import {
  type ACTION_SEND_EMAIL_CONFIGURATION,
  emails,
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
    })

    // Email might have been deleted. Do nothing.
    if (!email) {
      return
    }

    await Mailer.from('from@example.com', 'From Example')
      .to('to@example.com', 'To Example')
      .subject('Welcome to my hood.')
      .content('<h1>Welcome to my hood.</h1>')
      .send()
  }
}
