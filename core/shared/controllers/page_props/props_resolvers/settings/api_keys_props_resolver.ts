import { AccessTokenRepository } from '#root/core/auth/acess_tokens/repositories/access_token_repository'
import type { HonoContext } from '#root/core/shared/server/types.js'
import { container } from '#root/core/utils/typi'
import type { DefaultPageProps } from '#root/pages/types/page-context'

export class SettingsApiKeysPropsResolver {
  static get regex() {
    return [/\/w\/settings\/api-keys/]
  }

  async resolve(_pathname: string, _defaultProps: DefaultPageProps, ctx: HonoContext) {
    const teamId = ctx.get('team')?.id

    const apiKeys = await container
      .make(AccessTokenRepository)
      .accesstokens()
      .findAllForTeam(teamId)

    return {
      apiKeys: apiKeys.map((apiKey) => ({
        name: apiKey.name,
        capabilities: apiKey.capabilities,
        createdAt: apiKey.createdAt,
        lastUsedAt: apiKey.lastUsedAt,
        id: apiKey.id,
        preview: apiKey.preview,
      })),
    }
  }
}
