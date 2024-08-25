import { TeamRepository } from "@/teams/repositories/team_repository.ts"

import { AccessTokenRepository } from "@/auth/acess_tokens/repositories/access_token_repository.js"

import { makeDatabase, makeEnv } from "@/shared/container/index.js"
import { Encryption } from "@/shared/utils/encryption/encryption.ts"

import { container } from "@/utils/typi.js"

export class CreateTeamAccessTokenAction {
  constructor(
    private accessTokenRepository = container.make(AccessTokenRepository),
    private teamRepository = container.make(TeamRepository),
    private database = makeDatabase(),
    private env = makeEnv(),
  ) {}

  handle = async (teamId: string) => {
    const { accessToken } = await this.database.transaction(async (tx) => {
      const accessToken = await this.accessTokenRepository.createAccessToken(
        { id: teamId },
        "team",
      )

      const encryptedApiKey = new Encryption(this.env.APP_KEY).encrypt(
        accessToken.toJSON().token as string,
      )

      await this.teamRepository
        .transaction(tx)
        .usage(teamId)
        .set({ apiKey: encryptedApiKey.release() })

      return { accessToken }
    })

    return accessToken
  }
}
