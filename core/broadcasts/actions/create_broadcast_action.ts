import { and, eq } from 'drizzle-orm'

import type { CreateBroadcastDto } from '#root/core/broadcasts/dto/create_broadcast_dto.js'
import { BroadcastRepository } from '#root/core/broadcasts/repositories/broadcast_repository.js'

import { SendingDomainRepository } from '#root/core/sending_domains/repositories/sending_domain_repository.js'

import { sendingDomains } from '#root/database/schema.js'

import { AudienceRepository } from '#root/core/audiences/repositories/audience_repository.js'
import { E_OPERATION_FAILED } from '#root/core/http/responses/errors.js'
import { container } from '#root/core/utils/typi.js'

/**
 * CreateBroadcastAction handles the creation of new email marketing campaigns.
 *
 * This action is responsible for creating new broadcast campaigns in the system. It handles:
 * 1. Validating that the team has a valid audience to send to
 * 2. Finding an appropriate sending domain for the broadcast
 * 3. Creating the broadcast record with the necessary relationships
 *
 * Broadcasts are the core email marketing feature in Kibamail, allowing teams to send
 * one-time email campaigns to their audience. This action is the entry point for creating
 * these campaigns through the API.
 */
export class CreateBroadcastAction {
  constructor(
    private broadcastRepository = container.make(BroadcastRepository),
    private audienceRepository = container.make(AudienceRepository),
  ) {}

  /**
   * Creates a new broadcast campaign for a team.
   *
   * This method implements the broadcast creation process:
   * 1. Retrieves the team's primary audience
   * 2. Validates that the team has an audience to send to
   * 3. Finds an appropriate sending domain for the broadcast
   * 4. Creates the broadcast record with all necessary relationships
   *
   * The method automatically associates the broadcast with the team's primary audience
   * and attempts to find a sending domain specifically configured for marketing emails
   * (product='engage'). This simplifies the API by requiring minimal input from clients
   * while ensuring the broadcast has all necessary relationships.
   *
   * @param data - The broadcast creation data from the client
   * @param teamId - The ID of the team creating the broadcast
   * @returns Object containing the ID of the created broadcast
   * @throws E_OPERATION_FAILED if the team doesn't have an audience
   */
  async handle(data: CreateBroadcastDto, teamId: string) {
    // Retrieve the team's primary audience
    const audience = await this.audienceRepository.getAudienceForTeam(teamId)

    // Validate that the team has an audience to send to
    if (!audience) {
      throw E_OPERATION_FAILED('No audience found for team.')
    }

    // Find a sending domain specifically configured for marketing emails
    // This ensures the broadcast uses the correct domain for sending
    const sendingDomain = await container
      .make(SendingDomainRepository)
      .domains()
      .findOne(
        and(eq(sendingDomains.teamId, teamId), eq(sendingDomains.product, 'engage')),
      )

    // Create the broadcast record with all necessary relationships
    return this.broadcastRepository.create(
      { ...data, sendingDomainId: sendingDomain?.id, audienceId: audience.id },
      teamId,
    )
  }
}
