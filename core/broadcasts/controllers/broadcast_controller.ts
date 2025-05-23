import { safeParseAsync } from 'valibot'

import { CreateBroadcastAction } from '#root/core/broadcasts/actions/create_broadcast_action.js'
import { DeleteBroadcastAction } from '#root/core/broadcasts/actions/delete_broadcast_action.js'
import { GetBroadcastsAction } from '#root/core/broadcasts/actions/get_broadcasts_action.js'
import { SendBroadcastAction } from '#root/core/broadcasts/actions/send_broadcast_action.js'
import { UnsendBroadcastAction } from '#root/core/broadcasts/actions/unsend_broadcast_action.js'
import { UpdateBroadcastAction } from '#root/core/broadcasts/actions/update_broadcast_action.js'
import { ValidateBroadcastEmailContentAction } from '#root/core/broadcasts/actions/validate_broadcast_email_content_action.js'
import { BroadcastValidationAndAuthorizationConcern } from '#root/core/broadcasts/concerns/broadcast_validation_concern.js'
import { CreateBroadcastDto } from '#root/core/broadcasts/dto/create_broadcast_dto.js'
import {
  SendBroadcastEmailContentSchema,
  SendBroadcastSchema,
} from '#root/core/broadcasts/dto/send_broadcast_dto.js'
import { UpdateBroadcastDto } from '#root/core/broadcasts/dto/update_broadcast_dto.js'
import { BroadcastRepository } from '#root/core/broadcasts/repositories/broadcast_repository.js'

import type {
  Broadcast,
  BroadcastWithEmailContent,
} from '#root/database/database_schema_types.js'

import { E_VALIDATION_FAILED } from '#root/core/http/responses/errors.js'

import { makeApp } from '#root/core/shared/container/index.js'
import { BaseController } from '#root/core/shared/controllers/base_controller.js'
import type { HonoContext } from '#root/core/shared/server/types.js'

import { RenderBroadcastContentAction } from '#root/core/broadcasts/actions/render_broadcast_content_action.js'
import { TeamCreditRepository } from '#root/core/teams/repositories/team_credit_repository.js'
import { container } from '#root/core/utils/typi.js'

/**
 * BroadcastController handles API endpoints for managing email marketing campaigns.
 *
 * This controller is responsible for the core email marketing functionality in Kibamail,
 * providing endpoints to create, manage, and send broadcast campaigns. These broadcasts
 * enable marketing features such as:
 *
 * - Newsletter distribution to audience segments
 * - Promotional campaigns for products or services
 * - Announcement emails to entire audiences
 * - A/B testing different email content variations
 *
 * The controller enforces proper authorization and validation for all broadcast
 * operations, ensuring that users can only manage broadcasts they have access to
 * and that all broadcasts meet the required criteria before sending.
 */
export class BroadcastController extends BaseController {
  constructor(
    private app = makeApp(),
    private broadcastValidationAndAuthorizationConcern = container.make(
      BroadcastValidationAndAuthorizationConcern,
    ),
  ) {
    super()

    // Define routes for broadcast list operations
    this.app.defineRoutes(
      [
        // Create a new broadcast campaign
        ['POST', '/', this.create],
        // List all broadcasts for the current team
        ['GET', '/', this.index],
      ],
      {
        prefix: 'broadcasts',
      },
    )

    // Define routes for individual broadcast operations
    this.app.defineRoutes(
      [
        // Delete a broadcast
        ['DELETE', '/', this.delete],
        // Get a specific broadcast
        ['GET', '/', this.get],
        // Preview the rendered content of a broadcast
        ['GET', '/preview', this.preview],
        // Update a broadcast's configuration
        ['PUT', '/', this.update],
        // Validate a broadcast's content before sending
        ['PUT', '/validate', this.validateContent],
        // Send a broadcast to its audience
        ['POST', '/send', this.send],
        // Cancel a scheduled broadcast
        ['POST', '/unsend', this.unsend],
      ],
      { prefix: 'broadcasts/:broadcastId' },
    )
  }

  index = async (ctx: HonoContext) => {
    this.ensureCanView(ctx)

    const broadcasts = await container.resolve(GetBroadcastsAction).handle()

    return ctx.json(broadcasts)
  }

  create = async (ctx: HonoContext) => {
    this.ensureCanAuthor(ctx)

    const data = await this.validate(ctx, CreateBroadcastDto)

    const broadcast = await container
      .resolve(CreateBroadcastAction)
      .handle(data, ctx.get('team').id)

    return this.response(ctx).json(broadcast, 201).send()
  }

  get = async (ctx: HonoContext) => {
    const broadcast = await this.ensureExists<Broadcast>(ctx, 'broadcastId')
    this.ensureCanView(ctx)

    return ctx.json(broadcast)
  }

  delete = async (ctx: HonoContext) => {
    this.ensureCanManage(ctx)
    const broadcast = await this.ensureExists<Broadcast>(ctx, 'broadcastId')

    await container.resolve(DeleteBroadcastAction).handle(broadcast.id)

    return ctx.json({ id: broadcast.id })
  }

  update = async (ctx: HonoContext) => {
    const broadcast = await this.ensureExists<Broadcast>(ctx, 'broadcastId')
    this.ensureCanAuthor(ctx)

    const data = await this.validate(ctx, UpdateBroadcastDto)

    const { id } = await container.resolve(UpdateBroadcastAction).handle(broadcast, data)

    return ctx.json({ id })
  }

  preview = async (ctx: HonoContext) => {
    const broadcast = await this.ensureExists<Broadcast>(ctx, 'broadcastId')

    this.ensureCanAuthor(ctx)

    const preview = await container
      .make(RenderBroadcastContentAction)
      .handle(broadcast as BroadcastWithEmailContent)

    return this.response(ctx).json({ preview }).send()
  }

  validateContent = async (ctx: HonoContext) => {
    const broadcast = await this.ensureExists<BroadcastWithEmailContent>(
      ctx,
      'broadcastId',
    )

    const results = await container
      .make(ValidateBroadcastEmailContentAction)
      .handle(broadcast)

    return this.response(ctx).json(results).send()
  }

  unsend = async (ctx: HonoContext) => {
    this.ensureCanManage(ctx)
    const broadcast = await this.ensureExists<Broadcast>(ctx, 'broadcastId')

    const allowedStatuses: Broadcast['status'][] = ['QUEUED_FOR_SENDING']

    if (!allowedStatuses?.includes(broadcast.status))
      throw E_VALIDATION_FAILED([
        {
          message: 'Only a broadcast that is already queued for sending can be unqueued.',
          field: 'status',
        },
      ])

    await container.resolve(UnsendBroadcastAction).handle(broadcast)

    return ctx.json({ id: broadcast.id })
  }

  /**
   * Sends a broadcast campaign to its audience.
   *
   * This method implements the comprehensive broadcast sending process:
   * 1. Verifies the user has permission to send broadcasts
   * 2. Retrieves the broadcast with its A/B test variants if applicable
   * 3. Validates the broadcast status (must be DRAFT or QUEUED_FOR_SENDING)
   * 4. Updates the broadcast with any final changes from the request
   * 5. Validates the broadcast against the sending schema
   * 6. Checks if the team has sufficient credits for the recipient count
   * 7. For A/B tests, validates all variant content
   * 8. Queues the broadcast for sending
   *
   * The method includes multiple validation steps to ensure that broadcasts
   * meet all requirements before being sent. This prevents issues like:
   * - Sending incomplete or invalid content
   * - Sending to more recipients than the team has credits for
   * - Sending broadcasts with invalid A/B test configurations
   *
   * @param ctx - The HTTP context containing the request data
   * @returns JSON response with the broadcast ID
   * @throws E_VALIDATION_FAILED if any validation check fails
   */
  send = async (ctx: HonoContext) => {
    const team = this.ensureTeam(ctx)
    this.ensureCanManage(ctx)

    let broadcast = await container
      .make(BroadcastRepository)
      .findByIdWithAbTestVariants(ctx.req.param('broadcastId'))

    async function refreshBroadcast() {
      broadcast = await container
        .make(BroadcastRepository)
        .findByIdWithAbTestVariants(ctx.req.param('broadcastId'))
    }

    if (!broadcast) {
      throw E_VALIDATION_FAILED([
        {
          message: 'Invalid broadcast ID provided.',
          field: 'broadcastId',
        },
      ])
    }

    const allowedStatuses: Broadcast['status'][] = ['DRAFT', 'QUEUED_FOR_SENDING']

    if (!allowedStatuses?.includes(broadcast.status))
      throw E_VALIDATION_FAILED([
        {
          message: 'Only a draft broadcast can be sent.',
          field: 'status',
        },
      ])

    const data = await this.validate(ctx, UpdateBroadcastDto)
    await container.resolve(UpdateBroadcastAction).handle(broadcast, data)

    await refreshBroadcast()

    const { success, issues } = await safeParseAsync(SendBroadcastSchema, {
      ...broadcast,
      sendAt: broadcast.sendAt?.toString(),
    })

    if (!success) throw E_VALIDATION_FAILED(issues)

    const availableCredits = await container
      .make(TeamCreditRepository)
      .totalAvailableCredits(team.id)

    const broadcastRecipients = await container
      .make(BroadcastRepository)
      .getTotalRecipients(broadcast)

    if (availableCredits < broadcastRecipients.length) {
      throw E_VALIDATION_FAILED([
        {
          message: 'Not enough credits to send this broadcast.',
          field: 'credits',
        },
      ])
    }

    if (broadcast.isAbTest) {
      const validations = await Promise.all(
        broadcast.abTestVariants.map((variant) =>
          safeParseAsync(SendBroadcastEmailContentSchema, variant.emailContent),
        ),
      )

      if (validations.some((validation) => validation.success === false)) {
        throw E_VALIDATION_FAILED([
          {
            message:
              'Some A/B test variants are invalid. Please make sure all variants are valid.',
            field: 'abTestVariants',
          },
          ...validations.flatMap((validation) => validation.issues),
        ])
      }
    }

    await container.make(SendBroadcastAction).handle(broadcast)

    return ctx.json({ id: broadcast.id })
  }
}
