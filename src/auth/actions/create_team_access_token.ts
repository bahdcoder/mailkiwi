import { makeDatabase, makeEnv } from '@/shared/container/index.js'
import { container } from '@/utils/typi.js'
import { AccessTokenRepository } from '@/auth/acess_tokens/repositories/access_token_repository.js'
import { RedisKeySetter } from '@/redis/redis_commands.js'
import { Encryption } from '@/shared/utils/encryption/encryption.ts'

export class CreateTeamAccessTokenAction {
  constructor(
    private accessTokenRepository = container.make(AccessTokenRepository),
    private database = makeDatabase(),
    private env = makeEnv(),
  ) {}

  handle = async (teamId: string) => {
    const { accessToken } = await this.database.transaction(async (tx) => {
      const accessToken = await this.accessTokenRepository.createAccessToken(
        { id: teamId },
        'team',
      )

      const encryptedApiKey = new Encryption(this.env.APP_KEY).encrypt(
        accessToken.toJSON().token as string,
      )

      await container
        .make(RedisKeySetter)
        .entity(teamId) // smtp username = teamId
        .set('TEAM_API_KEY', encryptedApiKey) // smtp password = api key

      return { accessToken }
    })

    return accessToken
  }
}
