import { CreateMessageSchema } from "../dto/create_message_dto.js"
import { ChannelRepository } from "../repositories/channel_repository.js"
import { MessageRepository } from "../repositories/message_repository.js"
import { and, eq } from "drizzle-orm"
import { DateTime } from "luxon"

import { Channel } from "@/database/database_schema_types.js"
import { channelMemberships } from "@/database/schema.js"

import { E_VALIDATION_FAILED } from "@/http/responses/errors.js"

import { makeApp } from "@/shared/container/index.js"
import { BaseController } from "@/shared/controllers/base_controller.js"
import { HonoContext } from "@/shared/server/types.js"
import { cuid } from "@/shared/utils/cuid/cuid.js"

import { container } from "@/utils/typi.js"

export class ChannelController extends BaseController {
  constructor(protected app = makeApp()) {
    super()
    this.app.defineRoutes([["POST", "/messages", this.createMessage]], {
      prefix: "channels/:channelId",
    })
  }

  createMessage = async (ctx: HonoContext) => {
    const user = ctx.get("user")
    const channel = await this.ensureExists<Channel>(ctx, "channelId")

    const payload = await this.validate(ctx, CreateMessageSchema)

    const [membership] = await container
      .make(ChannelRepository)
      .memberships()
      .findAll(
        and(
          eq(channelMemberships.userId, user.id),
          eq(channelMemberships.channelId, channel.id),
        ),
      )

    if (!membership) {
      throw E_VALIDATION_FAILED([
        {
          field: "channelId",
          message:
            "You are not a member of this channel. To send messages, please join this channel first. ",
        },
      ])
    }

    const messageSlug = cuid()

    const { id } = await container.make(MessageRepository).messages().create({
      id: messageSlug,
      userId: user?.id,
      slug: messageSlug,
      channelId: channel.id,
      content: payload.content,
      createdAt: DateTime.now().toJSDate(),
    })

    return ctx.json({ id })
  }
}
