import { ChannelRepository } from '#root/core/chat/repositories/channel_repository.js'
import { command, string } from '@drizzle-team/brocli'

import { container } from '#root/core/utils/typi.js'

export const addChannelCommand = command({
  name: 'add_channel',
  desc: 'Add a channel to the chat.',
  options: {
    name: string().required().desc('The name of the channel.'),
    ehloDomain: string()
      .required()
      .desc('The domain pointing to the sending source address.'),
    description: string().desc(
      'An seo friendly description of this channel. Will appear as a category to seo crawlers.',
    ),
  },
  async handler(opts) {
    const channelRepository = container.make(ChannelRepository)

    await channelRepository.channels().create({
      name: opts.name,
      description: opts.description,
      private: true,
    })
  },
})
