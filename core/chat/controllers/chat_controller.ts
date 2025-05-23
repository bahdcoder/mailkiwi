import { ChannelRepository } from '#root/core/chat/repositories/channel_repository.js'
import { MessageRepository } from '#root/core/chat/repositories/message_repository.js'
import { eq } from 'drizzle-orm'
import type { Next } from 'hono'
import type { NonOptional } from 'valibot'

import type { Message } from '#root/database/database_schema_types.js'
import { channels } from '#root/database/schema.js'

import { E_VALIDATION_FAILED } from '#root/core/http/responses/errors.js'

import { makeApp, makeDatabase } from '#root/core/shared/container/index.js'
import type { HonoContext } from '#root/core/shared/server/types.js'

import { container } from '#root/core/utils/typi.js'
import { BaseController } from '#root/core/shared/controllers/base_controller'

export class ChatController extends BaseController {
  constructor(
    protected app = makeApp(),
    protected database = makeDatabase(),
    protected channelRepository = container.make(ChannelRepository),
    protected messageRepository = container.make(MessageRepository),
  ) {
    super()

    this.app.defineRoutes([], {
      prefix: '',
      middleware: [],
    })

    this.app.defineRoutes([], {
      prefix: '/community/:slug',
      middleware: [],
    })
  }

  protected getChannel = async (ctx: HonoContext) => {
    const slug = ctx.req.param('slug')

    const [channel] = await this.channelRepository
      .channels()
      .findAll(eq(channels.name, ctx.req.param('slug')))

    if (!channel) {
      throw E_VALIDATION_FAILED([
        {
          field: 'slug',
          message: `Could not find a channel with name ${slug}`,
        },
      ])
    }

    return channel
  }

  protected getMessage = async (ctx: HonoContext) => {
    const channel = await this.getChannel(ctx)

    const messageId = ctx.req.param('messageId')

    const { next: cursor } = await this.messageRepository.findMessagePositionInChannel(
      messageId,
      channel.id,
    )

    const messages = await this.channelRepository.channelMessages(
      channel,
      cursor,
      'older',
    )

    const message = messages.data.find((message) => message.id === messageId)

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

  index = async (ctx: HonoContext) => {
    const publicChannels = await this.getChannels()

    return this.response(ctx).json({ channels: publicChannels })
  }

  channel = async (ctx: HonoContext, next: Next) => {
    const channel = await this.getChannel(ctx)
    const publicChannels = await this.getChannels()

    const cursor = ctx.req.query('cursor') as string
    const direction = (ctx.req.query('direction') as 'older' | 'newer') || 'older'

    const messages = await this.channelRepository.channelMessages(
      channel,
      cursor,
      direction,
    )

    return this.response(ctx).json({
      channel,
      messages,
      channels: publicChannels,
    })
  }

  message = async (ctx: HonoContext, next: Next) => {
    const { messages, channel, messageId } = await this.getMessage(ctx)

    return this.response(ctx).json({ messages, messageId, channel })
  }

  getReplies = async (
    ctx: HonoContext,
    cursor: string | undefined,
    direction: 'older' | 'newer' = 'older',
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
    const cursor = ctx.req.query('replies_cursor') as string

    const direction = (ctx.req.query('replies_direction') as 'older' | 'newer') || 'older'

    return { cursor, direction }
  }

  replies = async (ctx: HonoContext, next: Next) => {
    const { cursor, direction } = this.getRepliesQueryParameters(ctx)

    const replies = await this.getReplies(ctx, cursor, direction)

    return this.response(ctx).json({ cursor, replies })
  }

  reply = async (ctx: HonoContext, next: Next) => {
    let { cursor, direction } = this.getRepliesQueryParameters(ctx)
    const { messages, channel, message } = await this.getMessage(ctx)

    const replyId = ctx.req.param('replyId')

    if (!cursor) {
      const replyPosition = await this.messageRepository.findMessagePositionInChannel(
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

    return this.response(ctx).json(replies)
  }
}
