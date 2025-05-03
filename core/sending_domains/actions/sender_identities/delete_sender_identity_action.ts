import type { SenderIdentity } from '@/database/database_schema_types.js'
import { SenderIdentityRepository } from '@/sending_domains/repositories/sender_identity_repository.js'

import { container } from '@/utils/typi.js'

/**
 * Action for deleting a sender identity.
 *
 * This action handles the business logic for deleting a sender identity:
 * - Deletes the sender identity record
 */
export class DeleteSenderIdentityAction {
  constructor(
    private senderIdentityRepository = container.make(SenderIdentityRepository),
  ) {}

  async handle(senderIdentity: SenderIdentity) {
    return this.senderIdentityRepository.delete(senderIdentity.id)
  }
}
