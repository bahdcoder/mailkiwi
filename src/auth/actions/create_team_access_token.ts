import { TeamRepository } from "@/teams/repositories/team_repository.ts"

import { AccessTokenRepository } from "@/auth/acess_tokens/repositories/access_token_repository.js"

import { makeDatabase, makeEnv } from "@/shared/container/index.js"
import { cuid } from "@/shared/utils/cuid/cuid.ts"
import { Encryption } from "@/shared/utils/encryption/encryption.ts"

import { container } from "@/utils/typi.js"

export class CreateTeamAccessTokenAction {
  constructor(
    private accessTokenRepository = container.make(AccessTokenRepository),
    private teamRepository = container.make(TeamRepository),
    private database = makeDatabase(),
    private env = makeEnv(),
  ) {}

  handle = async (teamId: number) => {
    const { accessToken, username } = await this.database.transaction(
      async (tx) => {
        const username = cuid()

        const accessToken =
          await this.accessTokenRepository.createAccessToken(
            { id: teamId, username },
            "team",
          )

        const encryptedApiKey = new Encryption(this.env.APP_KEY).encrypt(
          accessToken.toJSON().token as string,
        )

        await this.teamRepository
          .apiKeys()
          .username(username)
          .apiKey(encryptedApiKey)
          .save()

        return { accessToken, username }
      },
    )

    return { accessToken, username }
  }
}
