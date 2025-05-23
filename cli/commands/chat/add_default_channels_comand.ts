import { appEnv } from '#root/core/app/env/app_env.js'
import { ChannelRepository } from '#root/core/chat/repositories/channel_repository.js'
import { command } from '@drizzle-team/brocli'
import { eq, inArray } from 'drizzle-orm'
import { DateTime } from 'luxon'

import type { InsertChannel } from '#root/database/database_schema_types.js'
import { channels } from '#root/database/schema.js'

import { makeDatabase, makeLogger } from '#root/core/shared/container/index.js'

import { container } from '#root/core/utils/typi.js'

export const defaultChannels: InsertChannel[] = [
  {
    name: 'support',
    description:
      "Need any assistance with Kibamail? Ask away. We'll be happy to help you out.",
    private: false,
  },
  {
    name: 'casual',
    description: "Let's talk about anything. Work? Sports? Anime?",
    private: false,
  },
  {
    name: 'support-developers',
    description:
      'Ask any questions related to integrating Kibamail APIs or using any of our SDKs.',
    private: false,
  },
  {
    name: 'open-source',
    description:
      'Conversations around making open source contributions, and onboarding to the Kibamail project.',
    private: false,
  },
  {
    name: 'bug-reports',
    description: "Found a bug? Thank you ! Let's talk about it here.",
    private: false,
  },
  {
    name: 'help-newsletters',
    description:
      "Let's talk about newsletters, and anything related to creating, growing and running a successful one.",
    private: false,
  },
  {
    name: 'help-email-marketing',
    description:
      'Discussions around email marketing such as deliverability, email marketing strategies, or even growing your email list, ',
    private: false,
  },
]

export const addDefaultChannelsCommand = command({
  name: 'add_default_channels',
  desc: 'Add all default channels to the chat.',
  async handler() {
    const database = makeDatabase()
    const logger = makeLogger()

    const existingChannels = await database
      .select({ name: channels.name })
      .from(channels)
      .where(
        inArray(
          channels.name,
          defaultChannels.map((channel) => channel.name),
        ),
      )

    const existingChannelNames = existingChannels.map((channel) => channel.name)

    const nonExistingChannels = defaultChannels.filter(
      (channel) => !existingChannelNames.includes(channel.name),
    )

    if (nonExistingChannels.length === 0) {
      if (!appEnv.isTest) {
        logger.info('All channels already created.')
      }

      return
    }

    await container
      .make(ChannelRepository)
      .channels()
      .bulkCreate(
        nonExistingChannels.map((channel) => ({
          ...channel,
          createdAt: DateTime.now().toJSDate(),
        })),
      )

    logger.info('Successfully created all default channels.')
  },
})
