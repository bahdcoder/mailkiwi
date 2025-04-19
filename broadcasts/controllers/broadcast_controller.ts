import { safeParseAsync } from "valibot"

import { CreateBroadcastAction } from "@/broadcasts/actions/create_broadcast_action.js"
import { DeleteBroadcastAction } from "@/broadcasts/actions/delete_broadcast_action.js"
import { GetBroadcastsAction } from "@/broadcasts/actions/get_broadcasts_action.js"
import { SendBroadcastAction } from "@/broadcasts/actions/send_broadcast_action.js"
import { UnsendBroadcastAction } from "@/broadcasts/actions/unsend_broadcast_action.js"
import { UpdateBroadcastAction } from "@/broadcasts/actions/update_broadcast_action.js"
import { ValidateBroadcastEmailContentAction } from "@/broadcasts/actions/validate_broadcast_email_content_action.js"
import { BroadcastValidationAndAuthorizationConcern } from "@/broadcasts/concerns/broadcast_validation_concern.js"
import { CreateBroadcastDto } from "@/broadcasts/dto/create_broadcast_dto.js"
import {
  SendBroadcastEmailContentSchema,
  SendBroadcastSchema,
} from "@/broadcasts/dto/send_broadcast_dto.js"
import { UpdateBroadcastDto } from "@/broadcasts/dto/update_broadcast_dto.js"
import { BroadcastRepository } from "@/broadcasts/repositories/broadcast_repository.js"

import type {
  Broadcast,
  BroadcastWithEmailContent,
} from "@/database/database_schema_types.js"

import { E_VALIDATION_FAILED } from "@/http/responses/errors.js"

import { makeApp } from "@/shared/container/index.js"
import { BaseController } from "@/shared/controllers/base_controller.js"
import type { HonoContext } from "@/shared/server/types.js"

import { container } from "@/utils/typi.js"
import { RenderBroadcastContentAction } from "@/broadcasts/actions/render_broadcast_content_action.js"
import { TeamCreditRepository } from "@/teams/repositories/team_credit_repository.js"

export class BroadcastController extends BaseController {
  constructor(
    private app = makeApp(),
    private broadcastValidationAndAuthorizationConcern = container.make(
      BroadcastValidationAndAuthorizationConcern
    )
  ) {
    super()

    this.app.defineRoutes(
      [
        ["POST", "/", this.create],
        ["GET", "/", this.index],
      ],
      {
        prefix: "broadcasts",
      }
    )

    this.app.defineRoutes(
      [
        ["DELETE", "/", this.delete],
        ["GET", "/", this.get],
        ["GET", "/preview", this.preview],
        ["PUT", "/", this.update],
        ["PUT", "/validate", this.validateContent],
        ["POST", "/send", this.send],
        ["POST", "/unsend", this.unsend],
      ],
      { prefix: "broadcasts/:broadcastId" }
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
      .handle(data, ctx.get("team").id)

    return this.response(ctx).json(broadcast, 201).send()
  }

  get = async (ctx: HonoContext) => {
    const broadcast = await this.ensureExists<Broadcast>(ctx, "broadcastId")
    this.ensureCanView(ctx)

    return ctx.json(broadcast)
  }

  delete = async (ctx: HonoContext) => {
    this.ensureCanManage(ctx)
    const broadcast = await this.ensureExists<Broadcast>(ctx, "broadcastId")

    await container.resolve(DeleteBroadcastAction).handle(broadcast.id)

    return ctx.json({ id: broadcast.id })
  }

  update = async (ctx: HonoContext) => {
    const broadcast = await this.ensureExists<Broadcast>(ctx, "broadcastId")
    this.ensureCanAuthor(ctx)

    const data = await this.validate(ctx, UpdateBroadcastDto)

    const { id } = await container
      .resolve(UpdateBroadcastAction)
      .handle(broadcast, data)

    return ctx.json({ id })
  }

  preview = async (ctx: HonoContext) => {
    const broadcast = await this.ensureExists<Broadcast>(ctx, "broadcastId")

    this.ensureCanAuthor(ctx)

    const preview = await container
      .make(RenderBroadcastContentAction)
      .handle(broadcast as BroadcastWithEmailContent)

    return this.response(ctx).json({ preview }).send()
  }

  validateContent = async (ctx: HonoContext) => {
    const broadcast = await this.ensureExists<BroadcastWithEmailContent>(
      ctx,
      "broadcastId"
    )

    const results = await container
      .make(ValidateBroadcastEmailContentAction)
      .handle(broadcast)

    return this.response(ctx).json(results).send()
  }

  unsend = async (ctx: HonoContext) => {
    this.ensureCanManage(ctx)
    const broadcast = await this.ensureExists<Broadcast>(ctx, "broadcastId")

    const allowedStatuses: Broadcast["status"][] = ["QUEUED_FOR_SENDING"]

    if (!allowedStatuses?.includes(broadcast.status))
      throw E_VALIDATION_FAILED([
        {
          message:
            "Only a broadcast that is already queued for sending can be unqueued.",
          field: "status",
        },
      ])

    await container.resolve(UnsendBroadcastAction).handle(broadcast)

    return ctx.json({ id: broadcast.id })
  }

  send = async (ctx: HonoContext) => {
    this.ensureCanManage(ctx)

    let broadcast = await container
      .make(BroadcastRepository)
      .findByIdWithAbTestVariants(ctx.req.param("broadcastId"))

    async function refreshBroadcast() {
      broadcast = await container
        .make(BroadcastRepository)
        .findByIdWithAbTestVariants(ctx.req.param("broadcastId"))
    }

    if (!broadcast) {
      throw E_VALIDATION_FAILED([
        {
          message: "Invalid broadcast ID provided.",
          field: "broadcastId",
        },
      ])
    }

    const allowedStatuses: Broadcast["status"][] = [
      "DRAFT",
      "QUEUED_FOR_SENDING",
    ]

    if (!allowedStatuses?.includes(broadcast.status))
      throw E_VALIDATION_FAILED([
        {
          message: "Only a draft broadcast can be sent.",
          field: "status",
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
      .totalAvailableCredits(ctx.team?.id)

    const broadcastRecipients = await container
      .make(BroadcastRepository)
      .getTotalRecipients(broadcast)

    if (availableCredits < broadcastRecipients.length) {
      throw E_VALIDATION_FAILED([
        {
          message: "Not enough credits to send this broadcast.",
          field: "credits",
        },
      ])
    }

    if (broadcast.isAbTest) {
      const validations = await Promise.all(
        broadcast.abTestVariants.map((variant) =>
          safeParseAsync(SendBroadcastEmailContentSchema, variant.emailContent)
        )
      )

      if (validations.some((validation) => validation.success === false)) {
        throw E_VALIDATION_FAILED([
          {
            message:
              "Some A/B test variants are invalid. Please make sure all variants are valid.",
            field: "abTestVariants",
          },
          ...validations.flatMap((validation) => validation.issues),
        ])
      }
    }

    await container.make(SendBroadcastAction).handle(broadcast)

    return ctx.json({ id: broadcast.id })
  }
}
;``
