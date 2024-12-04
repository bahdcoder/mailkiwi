import { MessageRepository } from "./message_repository.js"
import { and, asc, desc, eq, gt, isNotNull, isNull, lt, sql } from "drizzle-orm"

import { Channel, Message } from "@/database/database_schema_types.js"
import {
  channelMemberships,
  channels,
  messageReactions,
  messages,
  users,
} from "@/database/schema.js"

import { makeDatabase } from "@/shared/container/index.js"
import { BaseRepository } from "@/shared/repositories/base_repository.js"
import { Paginator } from "@/shared/utils/pagination/paginator.js"

export class ChannelRepository extends BaseRepository {
  constructor(protected database = makeDatabase()) {
    super()
  }

  channels() {
    return this.crud(channels)
  }

  memberships() {
    return this.crud(channelMemberships)
  }

  findById(id: string) {
    return this.channels().findById(id)
  }

  async createPrivateChannelForUsers(userIds: string[]) {
    const id = this.cuid()

    await this.database.transaction(async (trx) => {
      await trx.insert(channels).values({
        id,
        name: id,
        private: true,
      })

      await trx
        .insert(channelMemberships)
        .values(userIds.map((userId) => ({ userId, channelId: id })))
    })

    return { id }
  }

  channelMessages = async (
    channel: Channel,
    cursor: string | undefined,
    direction: "older" | "newer" = "older",
    parentMessageId?: string,
  ) => {
    const reactionsSubQuery = this.database
      .select({
        emoji: messageReactions.emoji,
        messageId: messageReactions.messageId,
        totalReactions: sql`count(*)`.as("totalReactions"),
      })
      .from(messageReactions)
      .groupBy(messageReactions.messageId, messageReactions.emoji)
      .as("reactions")

    return new Paginator<Message>(messages)
      .size(MessageRepository.MESSAGE_PAGE_SIZE)
      .field(messages.id)
      .select({
        id: messages.id,
        reactions: sql`
          coalesce(
                  case
                      when count(reactions.emoji) = 0 then json_object()
                      else json_objectagg(
                          coalesce(reactions.emoji, 'none'),
                          coalesce(reactions.totalReactions, 0)
                      )
                  end,
                  json_object()
              )
          `.as("reactions"),
        content: messages.content,
        user: sql`json_object(
                'id', BIN_TO_UUID(${users.id}, 1),
                'firstName', ${users.firstName},
                'lastName', ${users.lastName},
                'role', ${users.role}
            )`.as("user"),
      })
      .cursor(cursor)
      .modifyQueryOrder(direction === "older" ? desc(messages.id) : asc(messages.id))
      .modifyQuery((query) =>
        query
          .leftJoin(reactionsSubQuery, sql`${messages.id} = reactions.messageId`)
          .leftJoin(users, eq(messages.userId, users.id))
          .groupBy(messages.id),
      )
      .queryConditions([
        and(
          eq(messages.channelId, channel.id),
          parentMessageId
            ? eq(messages.parentMessageId, parentMessageId)
            : isNull(messages.parentMessageId),
        ),
      ])
      .modifyCursorCondition(
        and(
          ...(cursor
            ? [direction === "older" ? lt(messages.id, cursor) : gt(messages.id, cursor)]
            : []),
        ),
      )
      .modifyCursorResults((results, originalCursorResults) =>
        direction === "older"
          ? originalCursorResults
          : {
              next: results[0][messages.id.name],
              previous:
                results[MessageRepository.MESSAGE_PAGE_SIZE - 1][messages.id.name],
            },
      )
      .cursorPaginate()
  }
}
