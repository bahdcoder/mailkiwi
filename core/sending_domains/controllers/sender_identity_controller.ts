import { and, eq } from 'drizzle-orm'

import { sendingDomains } from '@/database/schema.js'

import { CreateSenderIdentityAction } from '@/sending_domains/actions/sender_identities/create_sender_identity_action.js'
import { DeleteSenderIdentityAction } from '@/sending_domains/actions/sender_identities/delete_sender_identity_action.js'
import { GenerateEmailVerificationCodeAction } from '@/sending_domains/actions/sender_identities/generate_email_verification_code_action.js'
import { UpdateSenderIdentityAction } from '@/sending_domains/actions/sender_identities/update_sender_identity_action.js'
import { VerifyEmailAction } from '@/sending_domains/actions/sender_identities/verify_email_action.js'
import { CreateSenderIdentitySchema } from '@/sending_domains/dto/sender_identities/create_sender_identity_dto.js'
import { UpdateSenderIdentitySchema } from '@/sending_domains/dto/sender_identities/update_sender_identity_dto.js'
import { VerifySenderIdentityEmailSchema } from '@/sending_domains/dto/sender_identities/verify_sender_identity_email_dto.js'
import { SenderIdentityRepository } from '@/sending_domains/repositories/sender_identity_repository.js'
import { SendingDomainRepository } from '@/sending_domains/repositories/sending_domain_repository.js'

import { makeApp } from '@/shared/container/index.js'
import { BaseController } from '@/shared/controllers/base_controller.js'
import type { HonoContext } from '@/shared/server/types.js'

import { container } from '@/utils/typi.js'
import {
  SenderIdentity,
  SenderIdentityWithSendingDomain,
} from '@/database/database_schema_types.js'
import { E_VALIDATION_FAILED } from '@/http/responses/errors.js'

/**
 * Controller for managing sender identities.
 *
 * This controller handles HTTP requests related to sender identities:
 * - Creating, updating, and deleting sender identities
 * - Listing sender identities for a team
 * - Managing email verification for sender identities
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
   * List all sender identities for the team.
   */
  async index(ctx: HonoContext) {
    const team = this.ensureTeam(ctx)

    const senderIdentities = await this.senderIdentityRepository.findAllForTeam(team.id)

    return ctx.json(senderIdentities)
  }

  /**
   * Create a new sender identity.
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
   * Get a specific sender identity.
   */
  async show(ctx: HonoContext) {
    const senderIdentity = await this.ensureExists<SenderIdentity>(
      ctx,
      'senderIdentityId',
    )

    return this.response(ctx).json(senderIdentity).send()
  }

  /**
   * Update a sender identity.
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

  async delete(ctx: HonoContext) {
    const senderIdentity = await this.ensureExists<SenderIdentity>(
      ctx,
      'senderIdentityId',
    )

    const result = await container.make(DeleteSenderIdentityAction).handle(senderIdentity)

    return this.response(ctx).json(result).send()
  }

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
