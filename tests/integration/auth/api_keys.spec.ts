import { describe, test } from "vitest"

import { TeamRepository } from "@/teams/repositories/team_repository.js"

import { AccessTokenRepository } from "@/auth/acess_tokens/repositories/access_token_repository.js"

import { createUser } from "@/tests/mocks/auth/users.js"
import { makeRequestAsUser } from "@/tests/utils/http.js"

import { container } from "@/utils/typi.js"

describe("@auth API Token Generation", () => {
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
      apiKey: expect.any(String),
    })
    expect(json.apiKey).toContain("kbt_")
    expect(json.apiKey).toHaveLength(92) // length of combining access key / secret and encoding in base64

    // TODO: Add assertion to test api key access.
    // This will be done after controllers have been modified to authenticate and authorize either by user or by access token (with capabilities)
  })
})
