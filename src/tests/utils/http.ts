import { container } from "tsyringe"

import { AccessTokenRepository } from "@/domains/auth/acess_tokens/repositories/access_token_repository.js"
import { makeApp, makeConfig } from "@/infrastructure/container.js"
import { Team, User } from "@/infrastructure/database/schema/types.ts"
import { HTTPMethods } from "@/infrastructure/server/types.ts"

export async function makeRequest(
  path: string,
  options: {
    method: HTTPMethods
    body?: object
    headers?: Record<string, string>
  },
) {
  const app = makeApp()

  return app.request(path, {
    method: options.method,
    body:
      options.method !== "GET" ? JSON.stringify(options.body ?? {}) : undefined,
    headers: new Headers({
      "Content-Type": "application/json",
      ...options?.headers,
    }),
  })
}

export async function makeRequestAsUser(
  user: User,
  injectOptions: {
    method: HTTPMethods
    path: string
    body?: object
    headers?: Record<string, string>
  },
) {
  const accessTokenRepository = container.resolve<AccessTokenRepository>(
    AccessTokenRepository,
  )

  const accessToken = await accessTokenRepository.createAccessToken(user)

  const { method, path, ...restOfOptions } = injectOptions

  return makeRequest(path, {
    method,
    body: injectOptions.body,
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${accessToken.toJSON()["token"]}`,
      [makeConfig().software.teamHeader]: (user as User & { teams: Team[] })
        ?.teams?.[0]?.id,
      ...restOfOptions.headers,
    },
  })
}
