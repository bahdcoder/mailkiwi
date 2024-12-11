import { appEnv } from "@/app/env/app_env.js"
import { randomBytes } from "crypto"
import { setSignedCookie } from "hono/cookie"

import { AccessTokenRepository } from "@/auth/acess_tokens/repositories/access_token_repository.js"
import { CreateTeamAccessTokenAction } from "@/auth/actions/create_team_access_token.js"

import type { Team, User } from "@/database/database_schema_types.js"

import { makeApp } from "@/shared/container/index.js"
import type { HTTPMethods, HonoContext } from "@/shared/server/types.js"
import { RedisSessionStore } from "@/shared/sessions/stores/redis_session_store.js"
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
    body: options.method !== "GET" ? JSON.stringify(options.body ?? {}) : undefined,
    headers: new Headers({
      "Content-Type": "application/json",
      ...options?.headers,
    }),
    redirect: "manual",
  })
}

export async function getCookieSessionForUser(user: User) {
  const sessionId = randomBytes(32).toString("hex")

  await container.make(RedisSessionStore).create(user.id, sessionId, {
    ip: "192.101.23.34",
    userAgent: "Mozilla/5.0",
  })

  let encryptedSessionId = ""

  const header = function (name: string, cookie: string) {
    encryptedSessionId = cookie
  }

  await setSignedCookie(
    {
      header,
    } as unknown as HonoContext,
    "session",
    sessionId,
    appEnv.APP_KEY.release(),
    {
      sameSite: "Strict",
      prefix: "secure",
      secure: appEnv.isProd,
      httpOnly: true,
      path: "/",
    },
  )

  return encryptedSessionId
}

export async function getApiKeyForTeam(teamId: string) {
  const { apiKey } = await container.make(CreateTeamAccessTokenAction).handle(teamId)

  return `Bearer ${apiKey}`
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
      [appEnv.software.teamHeader]: (
        teamId ?? (user as User & { teams: Team[] })?.teams?.[0]?.id
      )?.toString(),
      ...restOfOptions.headers,
    },
  })
}
