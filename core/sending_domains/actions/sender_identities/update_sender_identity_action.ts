import type {
  SenderIdentity,
  UpdateSenderIdentity,
} from '#root/database/database_schema_types.js'

import type { UpdateSenderIdentityDto } from '#root/core/sending_domains/dto/sender_identities/update_sender_identity_dto.js'
import { SenderIdentityRepository } from '#root/core/sending_domains/repositories/sender_identity_repository.js'

import { container } from '#root/core/utils/typi.js'

/**
 * Action for updating an existing sender identity.
 *
 * This action handles the business logic for updating a sender identity:
 * - Updates the sender identity record with the provided changes
 */
export class UpdateSenderIdentityAction {
  constructor(
    private senderIdentityRepository = container.make(SenderIdentityRepository),
  ) {}

  async handle(senderIdentity: SenderIdentity, payload: UpdateSenderIdentityDto) {
    // Create a properly typed update object
    const updateData: UpdateSenderIdentity = {
      name: payload.name,
      email: payload.email,
      sendingDomainId: payload.sendingDomainId,
      replyToEmail: payload.replyToEmail,
    }

    // Update the sender identity
    await this.senderIdentityRepository.update(senderIdentity.id, updateData)

    return { id: senderIdentity.id }
  }
}
