import { Team, User } from "@prisma/client"
import { FastifyInstance, InjectOptions } from "fastify"
import { container } from "tsyringe"

import { AccessTokenRepository } from "@/domains/auth/acess_tokens/repositories/access_token_repository"
import { makeApp, makeConfig } from "@/infrastructure/container"

export async function injectAsUser(
  user: User,
  injectOptions: InjectOptions,
): Promise<ReturnType<FastifyInstance["inject"]>> {
  const accessTokenRepository = container.resolve<AccessTokenRepository>(
    AccessTokenRepository,
  )

  const app = makeApp()
  const accessToken = await accessTokenRepository.createAccessToken(user)

  return app.inject({
    ...injectOptions,
    headers: {
      authorization: `Bearer ${accessToken.toJSON()["token"]}`,
      [makeConfig().software.teamHeader]: (user as User & { teams: Team[] })
        ?.teams?.[0]?.id,
      ...injectOptions?.headers,
    },
  })
}
