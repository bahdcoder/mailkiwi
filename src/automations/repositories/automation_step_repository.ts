import type { CreateAutomationStepDto } from "@/automations/dto/create_automation_step_dto.js";
import { BaseRepository } from "@/shared/repositories/base_repository.js";
import { makeDatabase } from "@/shared/container/index.js";
import type { DrizzleClient } from "@/database/client.js";
import {
  type AutomationStepConfiguration,
  automationSteps,
} from "@/database/schema/schema.js";

export class AutomationStepRepository extends BaseRepository {
  constructor(protected database: DrizzleClient = makeDatabase()) {
    super();
  }

  async create(
    automationId: string,
    { configuration, ...payload }: CreateAutomationStepDto,
  ) {
    const id = this.cuid();

    await this.database.insert(automationSteps).values({
      ...payload,
      id,
      automationId,
      configuration: configuration as AutomationStepConfiguration,
    });

    return { id };
  }
}
