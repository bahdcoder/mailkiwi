import { ChannelRepository } from "@/chat/repositories/channel_repository.js"
import { MessageRepository } from "@/chat/repositories/message_repository.js"
import { eq } from "drizzle-orm"
import { Next } from "hono"
import { NonOptional } from "valibot"

import { Message } from "@/database/database_schema_types.js"
import { channels } from "@/database/schema.js"

import { E_VALIDATION_FAILED } from "@/http/responses/errors.js"

import { makeApp, makeDatabase } from "@/shared/container/index.js"
import { VikeController } from "@/shared/controllers/vike_controller.js"
import { HonoContext } from "@/shared/server/types.js"

import { container } from "@/utils/typi.js"

export class ChatController extends VikeController {
  constructor(
    protected app = makeApp(),
    protected database = makeDatabase(),
    protected channelRepository = container.make(ChannelRepository),
    protected messageRepository = container.make(MessageRepository),
  ) {
    super()

    this.app.defineRoutes([...this.vikePath("/community", this.index)], {
      prefix: "",
      middleware: [],
    })

    this.app.defineRoutes(
      [
        ...this.vikePath("/m/:messageId/replies/:replyId", this.reply),
        ...this.vikePath("/m/:messageId/replies", this.replies),
        ...this.vikePath("/m/:messageId", this.message),
        ...this.vikePath("/", this.channel),
      ],
      {
        prefix: "/community/:slug",
        middleware: [],
      },
    )
  }

  protected getChannel = async (ctx: HonoContext) => {
    const slug = ctx.req.param("slug")

    const [channel] = await this.channelRepository
      .channels()
      .findAll(eq(channels.name, ctx.req.param("slug")))

    if (!channel) {
      throw E_VALIDATION_FAILED([
        {
          field: "slug",
          message: `Could not find a channel with name ${slug}`,
        },
      ])
    }

    return channel
  }

  protected getMessage = async (ctx: HonoContext) => {
    const channel = await this.getChannel(ctx)

    const messageId = ctx.req.param("messageId")

    const { next: cursor } =
      await this.messageRepository.findMessagePositionInChannel(
        messageId,
        channel.id,
      )

    const messages = await this.channelRepository.channelMessages(
      channel,
      cursor,
      "older",
    )

    const message = messages.data.find(
      (message) => message.id === messageId,
    )

    return {
      messages,
      cursor,
      channel,
      messageId,
      message: message as NonOptional<Message>,
    }
  }

  getChannels = async () => {
    const publicChannels = await this.channelRepository
      .channels()

      // TODO: If logged in, add user's private channels to the response.
      .findAll(eq(channels.private, false))

    return publicChannels
  }

  index = async (ctx: HonoContext, next: Next) => {
    const publicChannels = await this.getChannels()

    return this.page(ctx, next, { channels: publicChannels })
  }

  channel = async (ctx: HonoContext, next: Next) => {
    const channel = await this.getChannel(ctx)
    const publicChannels = await this.getChannels()

    const cursor = ctx.req.query("cursor") as string
    const direction =
      (ctx.req.query("direction") as "older" | "newer") || "older"

    const messages = await this.channelRepository.channelMessages(
      channel,
      cursor,
      direction,
    )

    return this.page(ctx, next, {
      channel,
      messages,
      channels: publicChannels,
    })
  }

  message = async (ctx: HonoContext, next: Next) => {
    const { messages, channel, messageId } = await this.getMessage(ctx)

    return this.page(ctx, next, { messages, messageId, channel })
  }

  getReplies = async (
    ctx: HonoContext,
    cursor: string | undefined,
    direction: "older" | "newer" = "older",
  ) => {
    const { messages, channel, messageId } = await this.getMessage(ctx)

    const replies = await this.channelRepository.channelMessages(
      channel,
      cursor,
      direction,
      messageId,
    )

    return {
      messages,
      channel,
      messageId,
      cursor,
      replies,
    }
  }

  getRepliesQueryParameters = (ctx: HonoContext) => {
    const cursor = ctx.req.query("replies_cursor") as string

    const direction =
      (ctx.req.query("replies_direction") as "older" | "newer") || "older"

    return { cursor, direction }
  }

  replies = async (ctx: HonoContext, next: Next) => {
    const { cursor, direction } = this.getRepliesQueryParameters(ctx)

    const replies = await this.getReplies(ctx, cursor, direction)

    return this.page(ctx, next, replies)
  }

  reply = async (ctx: HonoContext, next: Next) => {
    let { cursor, direction } = this.getRepliesQueryParameters(ctx)
    const { messages, channel, message } = await this.getMessage(ctx)

    const replyId = ctx.req.param("replyId")

    if (!cursor) {
      const replyPosition =
        await this.messageRepository.findMessagePositionInChannel(
          replyId,
          channel.id,
          message.id, // parentMessageId
        )

      cursor = replyPosition.next
    }

    const replies = await this.channelRepository.channelMessages(
      channel,
      cursor,
      direction,
      message.id,
    )

    return this.page(ctx, next, { replies, channel, messages })
  }
}
