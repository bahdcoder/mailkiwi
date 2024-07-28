import type { DrizzleClient } from '@/infrastructure/database/client.ts'
import type {
  AutomationStep,
  Contact,
} from '@/infrastructure/database/schema/types.ts'

export interface AutomationStepRunnerContext {
  database: DrizzleClient
}

export interface AutomationStepRunnerContract {
  run(ctx: AutomationStepRunnerContext): Promise<void>
}

export type AutomationStepRunnerContractConstructor = new (
  automationStep: AutomationStep,
  contact: Contact,
) => AutomationStepRunnerContract
