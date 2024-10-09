import { apiEnv } from "@/api/env/api_env.js"

import { AccessTokenRepository } from "@/auth/acess_tokens/repositories/access_token_repository.js"

import type {
  Team,
  User,
} from "@/database/schema/database_schema_types.js"

import { makeApp } from "@/shared/container/index.js"
import type { HTTPMethods } from "@/shared/server/types.js"
import { getAuthenticationHeaders } from "@/shared/utils/auth/get_auth_headers.js"

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
      options.method !== "GET"
        ? JSON.stringify(options.body ?? {})
        : undefined,
    headers: new Headers({
      "Content-Type": "application/json",
      ...options?.headers,
    }),
  })
}

export async function getCookieSessionForUser(user: User) {
  const response = await makeRequest("/auth/login", {
    method: "POST",
    body: {
      email: user.email,
      password: "password",
    },
  })

  const [sessionCookie] = response.headers.getSetCookie()

  return sessionCookie
}

export async function makeRequestAsUser(
  user: User,
  injectOptions: {
    method: HTTPMethods
    path: string
    body?: object
    headers?: Record<string, string>
  },
  teamId?: string,
) {
  const { method, path, ...restOfOptions } = injectOptions

  return makeRequest(path, {
    method,
    body: injectOptions.body,
    headers: {
      "Content-Type": "application/json",
      Cookie: await getCookieSessionForUser(user),
      [apiEnv.software.teamHeader]: (
        teamId ?? (user as User & { teams: Team[] })?.teams?.[0]?.id
      ).toString(),
      ...restOfOptions.headers,
    },
  })
}
