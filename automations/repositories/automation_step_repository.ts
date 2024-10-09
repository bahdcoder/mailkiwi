import { eq } from "drizzle-orm"

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
    automationId: string,
    { configuration, ...payload }: CreateAutomationStepDto,
  ) {
    const id = this.cuid()
    await this.database.insert(automationSteps).values({
      id,
      ...payload,
      automationId,
      configuration: configuration as AutomationStepConfiguration,
    })

    return { id }
  }

  async findById(automationStepId: string) {
    const [step] = await this.database
      .select()
      .from(automationSteps)
      .where(eq(automationSteps.id, automationStepId))

    return step
  }

  async findByParentId(automationStepId: string) {
    const [step] = await this.database
      .select()
      .from(automationSteps)
      .where(eq(automationSteps.parentId, automationStepId))

    return step
  }
}
