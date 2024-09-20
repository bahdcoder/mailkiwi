import { eq } from "drizzle-orm"

import type { CreateAutomationDto } from "@/automations/dto/create_automation_dto.js"

import type { DrizzleClient } from "@/database/client.js"
import type { FindAutomationByIdArgs } from "@/database/schema/database_schema_types.js"
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

  async findById(automationId: number) {
    const result = await this.hasManySteps((query) =>
      query.where(eq(automations.id, automationId)),
    )

    return result[0]
  }

  async create(payload: CreateAutomationDto, audienceId: number) {
    const result = await this.database
      .insert(automations)
      .values({ ...payload, audienceId })

    return { id: this.primaryKey(result) }
  }

  async update(payload: CreateAutomationDto, automationId: number) {
    await this.database
      .update(automations)
      .set(payload)
      .where(eq(automations.id, automationId))

    return { id: automationId }
  }
}
