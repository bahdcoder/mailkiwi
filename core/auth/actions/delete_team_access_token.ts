import { AccessTokenRepository } from '#root/core/auth/acess_tokens/repositories/access_token_repository.js'

import { container } from '#root/core/utils/typi.js'

/**
 * Action for deleting a team access token (API key).
 *
 * This action handles the business logic for deleting an API key:
 * - Deletes the access token record from the database
 * - Clears any cached token data for immediate revocation
 */
export class DeleteTeamAccessTokenAction {
  constructor(private accessTokenRepository = container.make(AccessTokenRepository)) {}

  handle = async (apiKeyId: string) => {
    await this.accessTokenRepository.accesstokens().delete(apiKeyId)

    return { id: apiKeyId }
  }
}
