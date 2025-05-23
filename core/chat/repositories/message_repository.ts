import { and, count, desc, eq, gt, isNull, lt } from 'drizzle-orm'

import { messageReactions, messages } from '#root/database/schema.js'

import { makeDatabase } from '#root/core/shared/container/index.js'
import { BaseRepository } from '#root/core/shared/repositories/base_repository.js'

export class MessageRepository extends BaseRepository {
  static MESSAGE_PAGE_SIZE = 50

  constructor(protected database = makeDatabase()) {
    super()
  }

  messages() {
    return this.crud(messages)
  }

  reactions() {
    return this.crud(messageReactions)
  }

  async findMessagePositionInChannel(
    messageId: string,
    channelId: string,
    parentMessageId?: string,
  ) {
    const [[{ position }], [{ total }]] = await Promise.all([
      this.database
        .select({
          position: count(),
        })
        .from(messages)
        .where(
          and(
            parentMessageId
              ? eq(messages.parentMessageId, parentMessageId)
              : isNull(messages.parentMessageId),
            eq(messages.channelId, channelId),
            lt(messages.id, messageId),
          ),
        ),
      this.database
        .select({
          total: count(),
        })
        .from(messages)
        .where(
          and(
            eq(messages.channelId, channelId),
            parentMessageId
              ? eq(messages.parentMessageId, parentMessageId)
              : isNull(messages.parentMessageId),
          ),
        ),
    ])

    const pageSize = MessageRepository.MESSAGE_PAGE_SIZE
    const pageIndex = Math.floor((total - position - 1) / pageSize)
    const endPagePosition = Math.max(total - (pageIndex + 1) * pageSize, 0)
    const startPagePosition = total - pageIndex * pageSize

    const startPageOffset = Math.max(total - startPagePosition - 1, 1)
    const endPageOffset = Math.max(total - endPagePosition - 1, 1)

    const [[{ next }], [{ previous }]] = await Promise.all([
      this.database
        .select({ next: messages.id })
        .from(messages)
        .where(
          parentMessageId
            ? eq(messages.parentMessageId, parentMessageId)
            : isNull(messages.parentMessageId),
        )
        .orderBy(desc(messages.id))
        .offset(startPageOffset)
        .limit(1),
      this.database
        .select({ previous: messages.id })
        .from(messages)
        .where(
          parentMessageId
            ? eq(messages.parentMessageId, parentMessageId)
            : isNull(messages.parentMessageId),
        )
        .orderBy(desc(messages.id))
        .offset(endPageOffset)
        .limit(1),
    ])

    return { next, previous }
  }
}
