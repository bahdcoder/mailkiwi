import type { CreateAutomationStepDto } from '@/domains/automations/dto/create_automation_step_dto.js'
import { BaseRepository } from '@/domains/shared/repositories/base_repository.js'
import { makeDatabase } from '@/infrastructure/container.js'
import type { DrizzleClient } from '@/infrastructure/database/client.js'
import {
  type AutomationStepConfiguration,
  automationSteps,
} from '@/infrastructure/database/schema/schema.js'

export class AutomationStepRepository extends BaseRepository {
  constructor(protected database: DrizzleClient = makeDatabase()) {
    super()
  }

  async create(
    automationId: string,
    { configuration, ...payload }: CreateAutomationStepDto,
  ) {
    const id = this.cuid()

    await this.database.insert(automationSteps).values({
      ...payload,
      id,
      automationId,
      configuration: configuration as AutomationStepConfiguration,
    })

    return { id }
  }
}
