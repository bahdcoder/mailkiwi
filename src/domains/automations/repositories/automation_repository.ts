import { eq } from "drizzle-orm"
import { inject, injectable } from "tsyringe"

import { CreateAutomationDto } from "@/domains/automations/dto/create_automation_dto.js"
import { BaseRepository } from "@/domains/shared/repositories/base_repository.ts"
import { ContainerKey } from "@/infrastructure/container.js"
import { DrizzleClient } from "@/infrastructure/database/client.ts"
import { automations } from "@/infrastructure/database/schema/schema.ts"
import { FindAutomationByIdArgs } from "@/infrastructure/database/schema/types.ts"

@injectable()
export class AutomationRepository extends BaseRepository {
  constructor(
    @inject(ContainerKey.database) protected database: DrizzleClient,
  ) {
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
