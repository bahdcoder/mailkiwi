import { describe, test } from "vitest"

import { TeamRepository } from "@/teams/repositories/team_repository.js"

import { AccessTokenRepository } from "@/auth/acess_tokens/repositories/access_token_repository.js"

import { createUser } from "@/tests/mocks/auth/users.js"
import { makeRequestAsUser } from "@/tests/utils/http.js"

import { container } from "@/utils/typi.js"

describe.concurrent("@auth API Token Generation", () => {
  test("can generate an api token for api and smtp access", async ({
    expect,
  }) => {
    const { user } = await createUser()

    const response = await makeRequestAsUser(user, {
      method: "POST",
      path: "/auth/api-keys",
    })

    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toEqual({
      accessKey: expect.any(String),
      accessSecret: expect.any(String),
    })

    const teamApiKey = await container
      .make(TeamRepository)
      .apiKeys()
      .accessKey(json.accessKey)
      .get()

    expect(teamApiKey).toBeDefined()

    const verifiedToken = await container
      .resolve(AccessTokenRepository)
      .check(json.accessKey, json.accessSecret)

    expect(verifiedToken).toBeDefined()
  })
})
