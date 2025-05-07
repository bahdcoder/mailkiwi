import { setTimeout } from 'node:timers/promises'
import { ChannelRepository } from '@/chat/repositories/channel_repository.js'
import { MessageRepository } from '@/chat/repositories/message_repository.js'
import { faker } from '@faker-js/faker'
import { eq } from 'drizzle-orm'
import { DateTime } from 'luxon'
import { describe, test } from 'vitest'

import { createUser } from '@/tests/mocks/auth/users.js'
import { refreshDatabase } from '@/tests/mocks/teams/teams.js'
import { makeRequest, makeRequestAsUser } from '@/tests/utils/http.js'

import {
  type Channel,
  type InsertMessageReaction,
  type Message,
  MessageReaction,
} from '@/database/database_schema_types.js'
import { channelMemberships, channels, messages } from '@/database/schema.js'

import { makeDatabase } from '@/shared/container/index.js'
import { cuid } from '@/shared/utils/cuid/cuid.js'

import { container } from '@/utils/typi.js'

const database = makeDatabase()

describe('@chat channels', () => {
  test('renders the community page with a list of channels', async ({ expect }) => {
    const response = await makeRequest('/community', {
      method: 'GET',
    })

    const data = await response.json()

    expect(data.pageProps.channels).toBeDefined()

    const channels: Channel[] = data.pageProps.channels

    const openSourceChannel = channels.find((channel) => channel.name === 'open-source')

    expect(openSourceChannel).toBeDefined()
  })

  test('renders a specific channel, with its latest messages', async () => {})
})

describe('@chat messages', () => {
  test('a user can create a message in a channel as a member of that channel', async ({
    expect,
  }) => {
    const { user } = await createUser()

    const [channel] = await makeDatabase()
      .select()
      .from(channels)
      .where(eq(channels.name, 'support'))

    await makeDatabase().insert(channelMemberships).values({
      userId: user.id,
      channelId: channel.id,
    })

    const response = await makeRequestAsUser(user, {
      method: 'POST',
      path: `/channels/${channel.id}/messages`,
      body: {
        content: {
          blocks: ['i', 'love', 'this', 'text'],
        },
      },
    })

    expect(response.status).toBe(200)

    const allUserMessages = await container
      .make(MessageRepository)
      .messages()
      .findAll(eq(messages.userId, user.id))

    expect(allUserMessages).toHaveLength(1)
    expect(allUserMessages[0].channelId).toEqual(channel.id)
  })

  test('a user cannot send messages to a channel they are not a member of', async ({
    expect,
  }) => {
    const { user } = await createUser()
    const { user: secondUser } = await createUser()
    const { user: thirdUser } = await createUser()

    const { id: privateChannelId } = await container
      .make(ChannelRepository)
      .createPrivateChannelForUsers([user.id, secondUser.id])

    const privateResponse = await makeRequestAsUser(secondUser, {
      method: 'POST',
      path: `/channels/${privateChannelId}/messages`,
      body: {
        content: {
          blocks: ['i', 'love', 'this', 'text'],
        },
      },
    })

    expect(privateResponse.status).toEqual(200)

    // as a registered user, attempt to send message
    // // messageContent, channel
    const response = await makeRequestAsUser(thirdUser, {
      method: 'POST',
      path: `/channels/${privateChannelId}/messages`,
      body: {
        content: {
          blocks: ['i', 'love', 'this', 'text'],
        },
      },
    })

    expect(response.status).toEqual(422)

    const data = await response.json()

    expect(data.payload).toEqual({
      message: 'Validation failed.',
      errors: [
        {
          message:
            'You are not a member of this channel. To send messages, please join this channel first. ',
          field: 'channelId',
        },
      ],
    })
  })

  const setupTestMessages = async () => {
    const { user } = await createUser()
    const { user: secondUser } = await createUser()

    const messageRepository = container.make(MessageRepository)
    const channelRepository = container.make(ChannelRepository)

    const channelName = faker.string.uuid()

    const { id: channelId } = await container
      .make(ChannelRepository)
      .channels()
      .create({
        private: false,
        name: channelName,
        description: faker.lorem.words(5),
      })

    await channelRepository.memberships().bulkCreate([
      {
        userId: user.id,
        channelId,
      },
      {
        userId: secondUser.id,
        channelId,
      },
    ])

    const allMessagesIds: string[] = []

    async function generateMessageIds(count: number) {
      const ids: string[] = []

      for (let i = 0; i < count; i++) {
        await setTimeout(3)

        const id = cuid()

        ids.push(id)

        allMessagesIds.push(id)
      }

      return ids
    }

    for (let i = 1; i < 11; i++) {
      const chunkSize = 25

      const offset = (i - 1) * chunkSize

      const messageIds = await generateMessageIds(chunkSize)

      const createdAt = DateTime.now().toJSDate()

      await messageRepository.messages().bulkCreate(
        messageIds.map((id, idx) => ({
          id,
          content: {
            blocks: ['message number - ', (idx + offset).toString()],
          },
          userId: user.id,
          channelId,
          createdAt,
        })),
      )

      const checkMarkReactions: InsertMessageReaction[] = []
      const heartReactions: InsertMessageReaction[] = []

      for (const u of [user, secondUser]) {
        heartReactions.push(
          ...messageIds.map((messageId) => ({
            messageId,
            emoji: ':heart:',
            userId: u.id,
          })),
        )

        checkMarkReactions.push(
          ...messageIds.map((messageId) => ({
            messageId,
            emoji: ':checkmark:',
            userId: u.id,
          })),
        )
      }

      await messageRepository.reactions().bulkCreate(heartReactions)
      await messageRepository.reactions().bulkCreate(checkMarkReactions)
    }

    return { channelId, user, secondUser, channelName, allMessagesIds }
  }

  // biome-ignore lint/suspicious/noExplicitAny: Test response data
  function getMessagePositionsFromResponse(data: any) {
    return (data?.pageProps?.messages?.data || data).map(
      (message: Message) => message.content?.blocks?.[1],
    ) as string[]
  }

  test('can fetch a cursor paginated list of all messages in a channel', async ({
    expect,
  }) => {
    const { channelName } = await setupTestMessages()

    const response = await makeRequest(`/community/${channelName}`, {
      method: 'GET',
    })

    expect(response.status).toBe(200)

    const data = await response.json()

    const messagePositions = getMessagePositionsFromResponse(data)

    expect(messagePositions.slice(0, 10)).toEqual([
      '249',
      '248',
      '247',
      '246',
      '245',
      '244',
      '243',
      '242',
      '241',
      '240',
    ])

    expect(messagePositions.slice(40, 50)).toEqual([
      '209',
      '208',
      '207',
      '206',
      '205',
      '204',
      '203',
      '202',
      '201',
      '200',
    ])

    const nextCursor = data.pageProps.messages.next

    expect(nextCursor).toBeDefined()

    const nextResponse = await makeRequest(
      `/community/${channelName}?cursor=${nextCursor}&direction=older`,
      {
        method: 'GET',
      },
    )

    const nextData = await nextResponse.json()

    const nextMessagePositions = getMessagePositionsFromResponse(nextData)

    expect(nextMessagePositions.slice(0, 10)).toEqual([
      '199',
      '198',
      '197',
      '196',
      '195',
      '194',
      '193',
      '192',
      '191',
      '190',
    ])

    expect(nextMessagePositions.slice(40, 50)).toEqual([
      '159',
      '158',
      '157',
      '156',
      '155',
      '154',
      '153',
      '152',
      '151',
      '150',
    ])

    const secondNextResponse = await makeRequest(
      `/community/${channelName}?cursor=${nextData.pageProps.messages.next}&direction=older`,
      {
        method: 'GET',
      },
    )

    const secondNextData = await secondNextResponse.json()

    const secondNextMessagePositions = getMessagePositionsFromResponse(secondNextData)

    expect(secondNextMessagePositions.slice(0, 3)).toEqual(['149', '148', '147'])
    expect(secondNextMessagePositions.slice(47, 50)).toEqual(['102', '101', '100'])

    const previousResponse = await makeRequest(
      `/community/${channelName}?cursor=${secondNextData.pageProps.messages.previous}&direction=newer`,
      {
        method: 'GET',
      },
    )
    const previousData = await previousResponse.json()

    const previousMessagePositions =
      getMessagePositionsFromResponse(previousData).reverse()

    expect(previousMessagePositions.slice(0, 3)).toEqual(['199', '198', '197'])
    expect(previousMessagePositions.slice(47, 50)).toEqual(['152', '151', '150'])

    const secondPreviousResponse = await makeRequest(
      `/community/${channelName}?cursor=${previousData.pageProps.messages.previous}&direction=newer`,
      {
        method: 'GET',
      },
    )

    const secondPreviousData = await secondPreviousResponse.json()

    const secondPreviousMessagePositions =
      getMessagePositionsFromResponse(secondPreviousData).reverse()

    expect(secondPreviousMessagePositions.slice(0, 3)).toEqual(['249', '248', '247'])
    expect(secondPreviousMessagePositions.slice(47, 50)).toEqual(['202', '201', '200'])

    const backToNextResponse = await makeRequest(
      `/community/${channelName}?cursor=${secondPreviousData.pageProps.messages.next}&direction=older`,
      {
        method: 'GET',
      },
    )

    const backToNextData = await backToNextResponse.json()

    const backToNextMessagePositions = getMessagePositionsFromResponse(backToNextData)

    expect(backToNextMessagePositions.slice(0, 3)).toEqual(['199', '198', '197'])
    expect(backToNextMessagePositions.slice(47, 50)).toEqual(['152', '151', '150'])

    const backToNextSecondResponse = await makeRequest(
      `/community/${channelName}?cursor=${backToNextData.pageProps.messages.next}&direction=older`,
      {
        method: 'GET',
      },
    )

    const backToNextSecondData = await backToNextSecondResponse.json()

    const backToNextSecondMessagePositions =
      getMessagePositionsFromResponse(backToNextSecondData)

    expect(backToNextSecondMessagePositions.slice(0, 3)).toEqual(['149', '148', '147'])
    expect(backToNextSecondMessagePositions.slice(47, 50)).toEqual(['102', '101', '100'])
  })

  test('can fetch a specific message in the community', async ({ expect }) => {
    const { channelName, allMessagesIds } = await setupTestMessages()

    const messageId = allMessagesIds.slice(75, 120)[0]

    const [message] = await database
      .select()
      .from(messages)
      .where(eq(messages.id, messageId))

    const [channel] = await database
      .select()
      .from(channels)
      .where(eq(channels.name, channelName))

    const channelRepository = container.make(ChannelRepository)

    const latest = await channelRepository.channelMessages(channel, undefined, 'older')

    const secondLatest = await channelRepository.channelMessages(
      channel,
      latest.next,
      'older',
    )

    const thirdLatest = await channelRepository.channelMessages(
      channel,
      secondLatest.next,
      'older',
    )

    const fourthLatest = await channelRepository.channelMessages(
      channel,
      thirdLatest.next,
      'older',
    )

    const fourthLatestPositions = getMessagePositionsFromResponse(fourthLatest.data)

    const response = await makeRequest(`/community/${channelName}/m/${messageId}`, {
      method: 'GET',
    })

    const data = await response.json()

    const messagePositions = getMessagePositionsFromResponse(data)

    expect(messagePositions).toEqual(fourthLatestPositions)
  })

  const setupMessageReplies = async (
    channelId: string,
    parentMessageId: string,
    userId: string,
    count = 100,
  ) => {
    const ids = faker.helpers.multiple(cuid, { count })

    await container
      .make(MessageRepository)
      .messages()
      .bulkCreate(
        ids.map((id, idx) => ({
          id,
          parentMessageId,
          content: { blocks: ['message - ', (idx + 1).toString()] },
          channelId,
          userId,
          createdAt: DateTime.now().toJSDate(),
        })),
      )

    return { ids }
  }

  test('can fetch a paginated list of replies in a message thread,', async ({
    expect,
  }) => {
    const { channelName, allMessagesIds, user } = await setupTestMessages()

    const messageId = allMessagesIds.slice(75, 120)[0]

    const [channel] = await database
      .select()
      .from(channels)
      .where(eq(channels.name, channelName))

    await setupMessageReplies(channel.id, messageId, user.id)

    const response = await makeRequest(
      `/community/${channelName}/m/${messageId}/replies`,
      {
        method: 'GET',
      },
    )

    const data = await response.json()

    expect(data.pageProps.replies.data).toHaveLength(50)
    expect(data.pageProps.messages.data).toHaveLength(50)

    const positions = getMessagePositionsFromResponse(data.pageProps.replies.data)

    expect(positions.slice(0, 3)).toEqual(['100', '99', '98'])
    expect(positions.slice(47, 50)).toEqual(['53', '52', '51'])

    const nextReplies = await makeRequest(
      `/community/${channelName}/m/${messageId}/replies?replies_cursor=${data.pageProps.replies.next}`,
      {
        method: 'GET',
      },
    )

    const nextRepliesData = await nextReplies.json()

    const nextRepliesPositions = getMessagePositionsFromResponse(
      nextRepliesData.pageProps.replies.data,
    )

    expect(nextRepliesPositions.slice(0, 3)).toEqual(['50', '49', '48'])
    expect(nextRepliesPositions.slice(47, 50)).toEqual(['3', '2', '1'])
  })

  test('can fetch a specific message in a message thread', async ({ expect }) => {
    const { channelName, allMessagesIds, user } = await setupTestMessages()

    const messageId = allMessagesIds.slice(75, 120)[0]

    const [channel] = await database
      .select()
      .from(channels)
      .where(eq(channels.name, channelName))

    const { ids: allRepliesIds } = await setupMessageReplies(
      channel.id,
      messageId,
      user.id,
      175,
    )

    const replyId = allRepliesIds.slice(60, 100)[0]

    const response = await makeRequest(
      `/community/${channelName}/m/${messageId}/replies/${replyId}`,
      {
        method: 'GET',
      },
    )

    const data = await response.json()

    const positions = getMessagePositionsFromResponse(data.pageProps.replies.data)

    expect(positions.slice(0, 3)).toEqual(['75', '74', '73'])
    expect(positions.slice(47, 50)).toEqual(['28', '27', '26'])

    const nextResponse = await makeRequest(
      `/community/${channelName}/m/${messageId}/replies/${replyId}?replies_cursor=${data.pageProps.replies.next}`,
      {
        method: 'GET',
      },
    )

    const nextData = await nextResponse.json()

    const nextPositions = getMessagePositionsFromResponse(nextData.pageProps.replies.data)

    expect(nextPositions.slice(0, 3)).toEqual(['25', '24', '23'])
    expect(nextPositions.slice(22, 25)).toEqual(['3', '2', '1'])
  })
})
