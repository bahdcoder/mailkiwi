import { eq } from 'drizzle-orm'

import type { CreateAutomationDto } from '@/automations/dto/create_automation_dto.js'
import { BaseRepository } from '@/shared/repositories/base_repository.js'
import { makeDatabase } from '@/shared/container/index.js'
import type { DrizzleClient } from '@/database/client.js'
import { automations } from '@/database/schema/schema.js'
import type { FindAutomationByIdArgs } from '@/database/schema/database_schema_types.js'

export class AutomationRepository extends BaseRepository {
  constructor(protected database: DrizzleClient = makeDatabase()) {
    super()
  }

  async findById(automationId: string, args?: Partial<FindAutomationByIdArgs>) {
    return this.database.query.automations.findFirst({
      where: eq(automations.id, automationId),
      ...args,
    })
  }

  async create(payload: CreateAutomationDto, audienceId: string) {
    const id = this.cuid()

    await this.database
      .insert(automations)
      .values({ ...payload, id, audienceId })

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
