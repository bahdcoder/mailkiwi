import type { SenderIdentity } from '#root/database/database_schema_types.js'

import { SenderIdentityRepository } from '#root/core/sending_domains/repositories/sender_identity_repository.js'

import { container } from '#root/core/utils/typi.js'

/**
 * Action for generating an email verification code for a sender identity.
 *
 * This action handles the business logic for generating a verification code:
 * - Generates a secure 6-digit verification code
 * - Sets the expiration time for the verification code
 * - Updates the sender identity with the verification code
 * - Returns the plain verification code to be sent to the user
 */
export class GenerateEmailVerificationCodeAction {
  constructor(
    private senderIdentityRepository = container.make(SenderIdentityRepository),
  ) {}

  async handle(senderIdentity: SenderIdentity, domainName: string) {
    const {
      emailVerificationCode,
      emailVerificationCodeExpiresAt,
      plainEmailVerificationCode,
    } = await this.senderIdentityRepository.createEmailVerificationCode()

    await this.senderIdentityRepository.senderIdentities().update(senderIdentity.id, {
      emailVerificationCode,
      emailVerificationCodeExpiresAt,
    })

    // TODO: Dispatch job that sends confirmation email with kibamail sdk

    return {
      emailAddress: `${senderIdentity.email}@${domainName}`,
    }
  }
}
