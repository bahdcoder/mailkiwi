import { AccessTokenRepository } from "@/auth/acess_tokens/repositories/access_token_repository.js"

import type { Team, User } from "@/database/schema/database_schema_types.js"

import type { HTTPMethods } from "@/server/types.js"

import { makeApp, makeConfig } from "@/shared/container/index.js"

import { container } from "@/utils/typi.js"

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
      authorization: `Bearer ${accessToken.toJSON().token}`,
      [makeConfig().software.teamHeader]: (user as User & { teams: Team[] })
        ?.teams?.[0]?.id,
      ...restOfOptions.headers,
    },
  })
}
