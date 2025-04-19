import { and, eq } from 'drizzle-orm'

import type { CreateBroadcastDto } from '@/broadcasts/dto/create_broadcast_dto.js'
import { BroadcastRepository } from '@/broadcasts/repositories/broadcast_repository.js'

import { SendingDomainRepository } from '@/sending_domains/repositories/sending_domain_repository.js'

import { sendingDomains } from '@/database/schema.js'

import { container } from '@/utils/typi.js'
import { AudienceRepository } from '@/audiences/repositories/audience_repository.js'
import { E_OPERATION_FAILED } from '@/http/responses/errors.js'

export class CreateBroadcastAction {
  constructor(
    private broadcastRepository = container.make(BroadcastRepository),
    private audienceRepository = container.make(AudienceRepository),
  ) {}

  async handle(data: CreateBroadcastDto, teamId: string) {
    const audience = await this.audienceRepository.getAudienceForTeam(teamId)

    if (!audience) {
      throw E_OPERATION_FAILED('No audience found for team.')
    }

    const sendingDomain = await container
      .make(SendingDomainRepository)
      .domains()
      .findOne(
        and(eq(sendingDomains.teamId, teamId), eq(sendingDomains.product, 'engage')),
      )

    return this.broadcastRepository.create(
      { ...data, sendingDomainId: sendingDomain?.id, audienceId: audience.id },
      teamId,
    )
  }
}
