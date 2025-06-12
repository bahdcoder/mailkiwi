import { AccessTokenRepository } from '#root/core/auth/acess_tokens/repositories/access_token_repository.js'

import { container } from '#root/core/utils/typi.js'
import type { CreateTeamAccessTokenDto } from '#root/core/auth/dto/create_team_access_token_dto.js'

export class CreateTeamAccessTokenAction {
  constructor(private accessTokenRepository = container.make(AccessTokenRepository)) {}

  handle = async (teamId: string, data: CreateTeamAccessTokenDto) => {
    const { apiKey } = await this.accessTokenRepository.create(
      teamId,
      'team',
      [data?.capabilities] as ('full' | 'send' | 'engage')[],
      data?.name,
    )

    return { apiKey }
  }
}
