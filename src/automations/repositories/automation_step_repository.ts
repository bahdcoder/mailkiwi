import type { CreateAutomationStepDto } from "@/automations/dto/create_automation_step_dto.js"

import type { DrizzleClient } from "@/database/client.js"
import {
  type AutomationStepConfiguration,
  automationSteps,
} from "@/database/schema/schema.js"

import { makeDatabase } from "@/shared/container/index.js"
import { BaseRepository } from "@/shared/repositories/base_repository.js"

export class AutomationStepRepository extends BaseRepository {
  constructor(protected database: DrizzleClient = makeDatabase()) {
    super()
  }

  async create(
    automationId: number,
    { configuration, ...payload }: CreateAutomationStepDto,
  ) {
    const result = await this.database.insert(automationSteps).values({
      ...payload,
      automationId,
      configuration: configuration as AutomationStepConfiguration,
    })

    return { id: this.primaryKey(result) }
  }
}
