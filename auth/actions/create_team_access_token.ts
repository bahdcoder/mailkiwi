import { AccessTokenRepository } from "@/auth/acess_tokens/repositories/access_token_repository.js"

import { container } from "@/utils/typi.js"

export class CreateTeamAccessTokenAction {
  constructor(
    private accessTokenRepository = container.make(AccessTokenRepository),
  ) {}

  handle = async (teamId: string) => {
    const { apiKey } = await this.accessTokenRepository.create(
      teamId,
      "team",
      [],
    )

    return { apiKey }
  }
}
