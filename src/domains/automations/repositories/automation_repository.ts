import { eq } from 'drizzle-orm'

import type { CreateAutomationDto } from '@/domains/automations/dto/create_automation_dto.js'
import { BaseRepository } from '@/domains/shared/repositories/base_repository.js'
import { makeDatabase } from '@/infrastructure/container.js'
import type { DrizzleClient } from '@/infrastructure/database/client.js'
import { automations } from '@/infrastructure/database/schema/schema.js'
import type { FindAutomationByIdArgs } from '@/infrastructure/database/schema/types.js'

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
