import { ChannelRepository } from "@/chat/repositories/channel_repository.js"
import { defaultChannels } from "@/cli/commands/chat/add_default_channels_comand.js"
import { randomInt } from "crypto"

import { TeamRepository } from "@/teams/repositories/team_repository.js"

import type { CreateUserDto } from "@/auth/users/dto/create_user_dto.js"
import { UserRepository } from "@/auth/users/repositories/user_repository.js"

import { InsertUser } from "@/database/database_schema_types.js"

import { makeDatabase } from "@/shared/container/index.js"

import { container } from "@/utils/typi.js"

export class RegisterUserAction {
  constructor(
    private userRepository = container.make(UserRepository),
    private teamRepository = container.make(TeamRepository),
    private channelRepository = container.make(ChannelRepository),
    private database = makeDatabase(),
  ) {}

  handle = async (payload: InsertUser) => {
    const channels = await this.channelRepository.channels().findAll()

    const { user, team } = await this.database.transaction(async (tx) => {
      const user = await this.userRepository.transaction(tx).create({ ...payload })

      const team = await this.teamRepository
        .transaction(tx)
        .create({ name: user.id }, user.id)

      await this.channelRepository
        .transaction(tx)
        .memberships()
        .bulkCreate(
          channels.map((channel) => ({
            channelId: channel.id,
            userId: user.id,
          })),
        )

      return { user, team }
    })

    return { user, team }
  }
}
