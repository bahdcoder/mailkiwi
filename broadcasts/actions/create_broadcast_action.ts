import { and, eq } from "drizzle-orm"

import type { CreateBroadcastDto } from "@/broadcasts/dto/create_broadcast_dto.js"
import { BroadcastRepository } from "@/broadcasts/repositories/broadcast_repository.js"

import { SendingDomainRepository } from "@/sending_domains/repositories/sending_domain_repository.js"

import { sendingDomains } from "@/database/schema.js"

import { container } from "@/utils/typi.js"

export class CreateBroadcastAction {
  constructor(
    private broadcastRepository: BroadcastRepository = container.make(
      BroadcastRepository,
    ),
  ) {}

  async handle(data: CreateBroadcastDto, teamId: string) {
    const sendingDomain = await container
      .make(SendingDomainRepository)
      .domains()
      .findOne(
        and(eq(sendingDomains.teamId, teamId), eq(sendingDomains.product, "engage")),
      )

    return this.broadcastRepository.create(
      { ...data, sendingDomainId: sendingDomain?.id },
      teamId,
    )
  }
}
