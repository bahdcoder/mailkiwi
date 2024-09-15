import { safeParseAsync } from "valibot"

import { CreateBroadcastAction } from "@/broadcasts/actions/create_broadcast_action.js"
import { DeleteBroadcastAction } from "@/broadcasts/actions/delete_broadcast_action.js"
import { GetBroadcastAction } from "@/broadcasts/actions/get_broadcast_action.js"
import { GetBroadcastsAction } from "@/broadcasts/actions/get_broadcasts_action.js"
import { SendBroadcastAction } from "@/broadcasts/actions/send_broadcast_action.js"
import { UpdateBroadcastAction } from "@/broadcasts/actions/update_broadcast_action.js"
import { BroadcastValidationAndAuthorizationConcern } from "@/broadcasts/concerns/broadcast_validation_concern.js"
import { CreateBroadcastDto } from "@/broadcasts/dto/create_broadcast_dto.js"
import {
  SendBroadcastEmailContentSchema,
  SendBroadcastSchema,
} from "@/broadcasts/dto/send_broadcast_dto.js"
import { UpdateBroadcastDto } from "@/broadcasts/dto/update_broadcast_dto.js"
import { BroadcastRepository } from "@/broadcasts/repositories/broadcast_repository.ts"

import { Broadcast } from "@/database/schema/database_schema_types.ts"

import type { HonoContext } from "@/server/types.js"

import { E_VALIDATION_FAILED } from "@/http/responses/errors.js"

import { makeApp } from "@/shared/container/index.js"
import { BaseController } from "@/shared/controllers/base_controller.js"

import { container } from "@/utils/typi.js"

export class BroadcastController extends BaseController {
  constructor(
    private app = makeApp(),
    private broadcastValidationAndAuthorizationConcern = container.make(
      BroadcastValidationAndAuthorizationConcern,
    ),
  ) {
    super()

    this.app.defineRoutes(
      [
        ["POST", "/", this.create],
        ["GET", "/", this.index],
      ],
      {
        prefix: "broadcasts",
      },
    )

    this.app.defineRoutes(
      [
        ["DELETE", "/", this.delete],
        ["GET", "/", this.get],
        ["PUT", "/", this.update],
        ["POST", "/send", this.send],
      ],
      { prefix: "broadcasts/:broadcastId" },
    )
  }

  index = async (ctx: HonoContext) => {
    await this.broadcastValidationAndAuthorizationConcern.ensureHasPermissions(
      ctx,
    )

    const broadcasts = await container
      .resolve(GetBroadcastsAction)
      .handle()

    return ctx.json(broadcasts)
  }

  create = async (ctx: HonoContext) => {
    this.ensureCanAuthor(ctx)

    const data = await this.validate(ctx, CreateBroadcastDto)

    const broadcast = await container
      .resolve(CreateBroadcastAction)
      .handle(data, ctx.get("team").id)

    return ctx.json(broadcast, 201)
  }

  get = async (ctx: HonoContext) => {
    const broadcast =
      await this.broadcastValidationAndAuthorizationConcern.ensureBroadcastExists(
        ctx,
      )
    this.ensureCanView(ctx)

    return ctx.json(broadcast)
  }

  delete = async (ctx: HonoContext) => {
    this.ensureCanManage(ctx)
    const broadcast = await this.ensureExists<Broadcast>(
      ctx,
      "broadcastId",
    )

    await container.resolve(DeleteBroadcastAction).handle(broadcast.id)

    return ctx.json({ id: broadcast.id })
  }

  update = async (ctx: HonoContext) => {
    const broadcast =
      await this.broadcastValidationAndAuthorizationConcern.ensureBroadcastExists(
        ctx,
      )
    this.ensureCanAuthor(ctx)

    const data = await this.validate(ctx, UpdateBroadcastDto)

    const { id } = await container
      .resolve(UpdateBroadcastAction)
      .handle(broadcast, data)

    return ctx.json({ id })
  }

  send = async (ctx: HonoContext) => {
    this.ensureCanManage(ctx)
    const broadcast = await container
      .make(BroadcastRepository)
      .findByIdWithAbTestVariants(parseInt(ctx.req.param("broadcastId")))

    if (!broadcast) {
      throw E_VALIDATION_FAILED([
        {
          message: "Invalid broadcast ID provided.",
          field: "broadcastId",
        },
      ])
    }

    if (broadcast.status !== "DRAFT")
      throw E_VALIDATION_FAILED([
        {
          message: "Only a draft broadcast can be sent.",
          field: "status",
        },
      ])

    const { success, issues } = await safeParseAsync(SendBroadcastSchema, {
      ...broadcast,
      sendAt: broadcast.sendAt?.toString(),
    })

    if (!success) throw E_VALIDATION_FAILED(issues)

    if (broadcast.isAbTest) {
      const validations = await Promise.all(
        broadcast.abTestVariants.map((variant) =>
          safeParseAsync(
            SendBroadcastEmailContentSchema,
            variant.emailContent,
          ),
        ),
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
