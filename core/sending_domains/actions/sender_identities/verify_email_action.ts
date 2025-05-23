import { DateTime } from 'luxon'

import type { SenderIdentity } from '#root/database/database_schema_types.js'
import type { VerifySenderIdentityEmailDto } from '#root/core/sending_domains/dto/sender_identities/verify_sender_identity_email_dto.js'
import { SenderIdentityRepository } from '#root/core/sending_domains/repositories/sender_identity_repository.js'

import { container } from '#root/core/utils/typi.js'
import { E_VALIDATION_FAILED } from '#root/core/http/responses/errors.js'

/**
 * Action for verifying a sender identity email using a verification code.
 *
 * This action handles the business logic for email verification:
 * - Checks if the verification code has expired
 * - Verifies that the provided code matches the stored code
 * - If valid, marks the sender identity email as verified
 * - Clears the verification code to prevent reuse
 */
export class VerifyEmailAction {
  constructor(
    private senderIdentityRepository = container.make(SenderIdentityRepository),
  ) {}

  async handle(senderIdentity: SenderIdentity, payload: VerifySenderIdentityEmailDto) {
    if (senderIdentity.emailVerificationCodeExpiresAt) {
      const hasExpired =
        DateTime.fromJSDate(
          senderIdentity.emailVerificationCodeExpiresAt as Date,
        ).diffNow().milliseconds < 0

      if (hasExpired) {
        throw E_VALIDATION_FAILED([
          {
            message: 'Verification code has expired',
            field: 'code',
          },
        ])
      }
    }

    const verified = await this.senderIdentityRepository.confirmEmailVerificationCode(
      senderIdentity,
      payload.code,
    )

    if (!verified) {
      throw E_VALIDATION_FAILED([
        {
          message: 'Verification code was invalid.',
          field: 'code',
        },
      ])
    }

    await this.senderIdentityRepository.update(senderIdentity.id, {
      emailVerifiedAt: new Date(),
      emailVerificationCode: null,
      emailVerificationCodeExpiresAt: null,
    })

    return { verified }
  }
}
