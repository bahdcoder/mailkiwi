import type { CreateAutomationStepDto } from '@/domains/automations/dto/create_automation_step_dto.js'
import { BaseRepository } from '@/domains/shared/repositories/base_repository.js'
import { makeDatabase } from '@/infrastructure/container.ts'
import type { DrizzleClient } from '@/infrastructure/database/client.ts'
import { automationSteps } from '@/infrastructure/database/schema/schema.js'

export class AutomationStepRepository extends BaseRepository {
  constructor(protected database: DrizzleClient = makeDatabase()) {
    super()
  }

  async create(automationId: string, payload: CreateAutomationStepDto) {
    const id = this.cuid()

    await this.database.insert(automationSteps).values({
      ...payload,
      id,
      automationId,
    })

    return { id }
  }
}
