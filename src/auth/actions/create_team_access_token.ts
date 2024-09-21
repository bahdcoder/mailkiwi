import { TeamRepository } from "@/teams/repositories/team_repository.js"

import { AccessTokenRepository } from "@/auth/acess_tokens/repositories/access_token_repository.js"

import { makeDatabase } from "@/shared/container/index.js"

import { container } from "@/utils/typi.js"

export class CreateTeamAccessTokenAction {
  constructor(
    private accessTokenRepository = container.make(AccessTokenRepository),
    private teamRepository = container.make(TeamRepository),
    private database = makeDatabase(),
  ) {}

  handle = async (teamId: string) => {
    const { accessKey, accessSecret } = await this.database.transaction(
      async (tx) => {
        const { accessSecret, accessKey, hashedAccessSecret } =
          await this.accessTokenRepository.create(teamId, "team")

        await this.teamRepository
          .apiKeys()
          .accessKey(accessKey)
          .accessSecret(hashedAccessSecret)
          .save()

        return { accessSecret, accessKey }
      },
    )

    return { accessSecret, accessKey }
  }
}
