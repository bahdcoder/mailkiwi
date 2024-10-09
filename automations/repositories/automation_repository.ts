import { eq } from "drizzle-orm"

import type { CreateAutomationDto } from "@/automations/dto/create_automation_dto.js"

import type { DrizzleClient } from "@/database/client.js"
import { automationSteps, automations } from "@/database/schema/schema.js"
import { hasMany } from "@/database/utils/relationships.js"

import { makeDatabase } from "@/shared/container/index.js"
import { BaseRepository } from "@/shared/repositories/base_repository.js"

export class AutomationRepository extends BaseRepository {
  constructor(protected database: DrizzleClient = makeDatabase()) {
    super()
  }

  private hasManySteps = hasMany(this.database, {
    from: automations,
    to: automationSteps,
    primaryKey: automations.id,
    foreignKey: automationSteps.automationId,
    relationName: "steps",
  })

  async findById(automationId: string) {
    const [automation] = await this.hasManySteps((query) =>
      query.where(eq(automations.id, automationId)),
    )

    return automation
  }

  async create(payload: CreateAutomationDto, audienceId: string) {
    const id = this.cuid()
    await this.database
      .insert(automations)
      .values({ id, ...payload, audienceId })

    return { id }
  }

  async update(payload: CreateAutomationDto, automationId: string) {
    await this.database
      .update(automations)
      .set(payload)
      .where(eq(automations.id, automationId))

    return { id: automationId }
  }
}
