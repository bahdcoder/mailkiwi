import type { Redis } from 'ioredis'

import type { DrizzleClient } from '#root/database/client.js'
import type { AutomationStep, Contact } from '#root/database/database_schema_types.js'

export interface AutomationStepRunnerContext {
  database: DrizzleClient
  redis: Redis
}

export interface AutomationStepRunnerContract {
  run(ctx: AutomationStepRunnerContext): Promise<void>
}

export type AutomationStepRunnerContractConstructor = new (
  automationStep: AutomationStep,
  contact: Contact,
) => AutomationStepRunnerContract
