import { and, eq } from 'drizzle-orm'

import { sendingDomains } from '#root/database/schema.js'

import { CreateSenderIdentityAction } from '#root/core/sending_domains/actions/sender_identities/create_sender_identity_action.js'
import { DeleteSenderIdentityAction } from '#root/core/sending_domains/actions/sender_identities/delete_sender_identity_action.js'
import { GenerateEmailVerificationCodeAction } from '#root/core/sending_domains/actions/sender_identities/generate_email_verification_code_action.js'
import { UpdateSenderIdentityAction } from '#root/core/sending_domains/actions/sender_identities/update_sender_identity_action.js'
import { VerifyEmailAction } from '#root/core/sending_domains/actions/sender_identities/verify_email_action.js'
import { CreateSenderIdentitySchema } from '#root/core/sending_domains/dto/sender_identities/create_sender_identity_dto.js'
import { UpdateSenderIdentitySchema } from '#root/core/sending_domains/dto/sender_identities/update_sender_identity_dto.js'
import { VerifySenderIdentityEmailSchema } from '#root/core/sending_domains/dto/sender_identities/verify_sender_identity_email_dto.js'
import { SenderIdentityRepository } from '#root/core/sending_domains/repositories/sender_identity_repository.js'
import { SendingDomainRepository } from '#root/core/sending_domains/repositories/sending_domain_repository.js'

import { makeApp } from '#root/core/shared/container/index.js'
import { BaseController } from '#root/core/shared/controllers/base_controller.js'
import type { HonoContext } from '#root/core/shared/server/types.js'

import { container } from '#root/core/utils/typi.js'
import type {
  SenderIdentity,
  SenderIdentityWithSendingDomain,
} from '#root/database/database_schema_types.js'
import { E_VALIDATION_FAILED } from '#root/core/http/responses/errors.js'

/**
 * SenderIdentityController manages email sender identities for marketing campaigns.
 *
 * This controller is responsible for:
 * 1. Creating and managing sender identities (from name, email address)
 * 2. Verifying sender email addresses to ensure deliverability
 * 3. Associating sender identities with verified sending domains
 * 4. Enforcing team-based access control for sender resources
 *
 * Sender identities are critical for email deliverability and brand consistency.
 * This controller ensures that all sender identities are properly verified and
 * configured to maximize inbox placement and maintain sender reputation.
 */
export class SenderIdentityController extends BaseController {
  constructor(
    private app = makeApp(),
    private senderIdentityRepository = container.make(SenderIdentityRepository),
    private sendingDomainRepository = container.make(SendingDomainRepository),
  ) {
    super()

    this.app.defineRoutes(
      [
        ['GET', '/', this.index.bind(this)],
        ['POST', '/', this.store.bind(this)],
      ],
      {
        prefix: 'sender-identities',
      },
    )

    this.app.defineRoutes(
      [
        ['GET', '/', this.show.bind(this)],
        ['PATCH', '/', this.update.bind(this)],
        ['DELETE', '/', this.delete.bind(this)],
        ['POST', '/verify', this.verifyEmail.bind(this)],
        ['POST', '/verify/generate', this.generateVerificationCode.bind(this)],
      ],
      {
        prefix: 'sender-identities/:senderIdentityId',
      },
    )
  }

  /**
   * Lists all sender identities for the team.
   *
   * Returns a collection of sender identities that belong to the authenticated
   * user's team, including their verification status and associated domains.
   */
  async index(ctx: HonoContext) {
    const team = this.ensureTeam(ctx)

    const senderIdentities = await this.senderIdentityRepository.findAllForTeam(team.id)

    return ctx.json(senderIdentities)
  }

  /**
   * Creates a new sender identity.
   *
   * Validates the request data and creates a sender identity associated with
   * a verified sending domain. The sender identity will require email verification
   * before it can be used for sending emails.
   */
  async store(ctx: HonoContext) {
    const team = this.ensureTeam(ctx)
    const payload = await this.validate(ctx, CreateSenderIdentitySchema)

    const sendingDomain = await this.sendingDomainRepository
      .domains()
      .findOne(
        and(
          eq(sendingDomains.id, payload.sendingDomainId),
          eq(sendingDomains.teamId, team.id),
        ),
      )

    const senderIdentity = await container
      .make(CreateSenderIdentityAction)
      .handle(payload, team.id, sendingDomain)

    return this.response(ctx).json(senderIdentity).send()
  }

  /**
   * Retrieves a specific sender identity.
   *
   * Returns detailed information about a sender identity, including
   * its verification status and associated sending domain.
   */
  async show(ctx: HonoContext) {
    const senderIdentity = await this.ensureExists<SenderIdentity>(
      ctx,
      'senderIdentityId',
    )

    return this.response(ctx).json(senderIdentity).send()
  }

  /**
   * Updates a sender identity.
   *
   * Modifies sender identity information such as the display name or email address.
   * If the email address is changed, the sender identity will require
   * re-verification before it can be used for sending emails.
   */
  async update(ctx: HonoContext) {
    const team = this.ensureTeam(ctx)
    const senderIdentity = await this.ensureExists<SenderIdentity>(
      ctx,
      'senderIdentityId',
    )
    const payload = await this.validate(ctx, UpdateSenderIdentitySchema)

    if (payload.sendingDomainId) {
      const sendingDomain = await this.sendingDomainRepository
        .domains()
        .findOne(
          and(
            eq(sendingDomains.id, payload.sendingDomainId),
            eq(sendingDomains.teamId, team.id),
          ),
        )

      if (!sendingDomain) {
        return ctx.json({ error: 'The sending domain does not belong to this team' }, 400)
      }
    }

    const result = await container
      .make(UpdateSenderIdentityAction)
      .handle(senderIdentity, payload)

    return this.response(ctx).json(result).send()
  }

  /**
   * Deletes a sender identity.
   *
   * Permanently removes a sender identity from the system. This operation
   * cannot be undone, and any broadcasts using this sender identity will
   * need to be updated to use a different sender.
   */
  async delete(ctx: HonoContext) {
    const senderIdentity = await this.ensureExists<SenderIdentity>(
      ctx,
      'senderIdentityId',
    )

    const result = await container.make(DeleteSenderIdentityAction).handle(senderIdentity)

    return this.response(ctx).json(result).send()
  }

  /**
   * Generates a verification code for a sender identity email.
   *
   * Creates and sends a 6-digit verification code to the email address
   * associated with the sender identity. This code is required to verify
   * ownership of the email address before it can be used for sending.
   */
  async generateVerificationCode(ctx: HonoContext) {
    const senderIdentity = await this.ensureExists<SenderIdentityWithSendingDomain>(
      ctx,
      'senderIdentityId',
    )

    const result = await container
      .make(GenerateEmailVerificationCodeAction)
      .handle(senderIdentity, senderIdentity.sendingDomain.name)

    return this.response(ctx)
      .json({
        emailAddress: result.emailAddress,
      })
      .send()
  }

  /**
   * Verifies a sender identity email using a verification code.
   *
   * Validates the provided verification code against the stored code
   * for the sender identity. If valid, marks the email address as verified
   * and enables it for use in email campaigns.
   */
  async verifyEmail(ctx: HonoContext) {
    const payload = await this.validate(ctx, VerifySenderIdentityEmailSchema)

    const senderIdentity = await this.ensureExists<SenderIdentity>(
      ctx,
      'senderIdentityId',
    )

    const result = await container.make(VerifyEmailAction).handle(senderIdentity, payload)

    return this.response(ctx).json(result).send()
  }
}
