import type { DrizzleClient } from '@/database/client.ts'
import type {
  AutomationStep,
  Contact,
} from '@/database/schema/database_schema_types.js'
import type { Redis } from 'ioredis'

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
