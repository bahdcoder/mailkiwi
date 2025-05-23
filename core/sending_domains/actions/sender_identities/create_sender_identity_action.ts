import type { SendingDomain } from '#root/database/database_schema_types.js'

import type { CreateSenderIdentityDto } from '#root/core/sending_domains/dto/sender_identities/create_sender_identity_dto.js'
import { SenderIdentityRepository } from '#root/core/sending_domains/repositories/sender_identity_repository.js'

import { container } from '#root/core/utils/typi.js'

/**
 * Action for creating a new sender identity.
 *
 * This action handles the business logic for creating a sender identity:
 * - Creates the sender identity record
 * - Returns the created sender identity ID
 */
export class CreateSenderIdentityAction {
  constructor(
    private senderIdentityRepository = container.make(SenderIdentityRepository),
  ) {}

  async handle(
    payload: CreateSenderIdentityDto,
    teamId: string,
    sendingDomain: SendingDomain,
  ) {
    // Create the sender identity
    const senderIdentity = await this.senderIdentityRepository.create({
      name: payload.name,
      email: payload.email,
      sendingDomainId: sendingDomain.id,
      teamId,
      replyToEmail: payload.replyToEmail,
    })

    return senderIdentity
  }
}
