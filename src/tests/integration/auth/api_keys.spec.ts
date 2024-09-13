import { faker } from "@faker-js/faker"
import { Secret } from "@poppinss/utils"
import { eq } from "drizzle-orm"
import { describe, test } from "vitest"

import { TeamRepository } from "@/teams/repositories/team_repository.ts"

import { AccessTokenRepository } from "@/auth/acess_tokens/repositories/access_token_repository.ts"

import { createUser } from "@/tests/mocks/auth/users.js"
import { refreshRedisDatabase } from "@/tests/mocks/teams/teams.ts"
import { makeRequest, makeRequestAsUser } from "@/tests/utils/http.js"

import { accessTokens, teams, users } from "@/database/schema/schema.js"

import {
  makeApp,
  makeDatabase,
  makeEnv,
} from "@/shared/container/index.js"
import { Encryption } from "@/shared/utils/encryption/encryption.ts"

import { container } from "@/utils/typi.ts"

describe("@auth API Token Generation", () => {
  test("can generate an api token for api and smtp access", async ({
    expect,
  }) => {
    await refreshRedisDatabase()
    const database = makeDatabase()

    const { user, team } = await createUser()

    const response = await makeRequestAsUser(user, {
      method: "POST",
      path: "/auth/api-keys",
    })

    const accessKeysFromDatabase =
      await database.query.accessTokens.findFirst({
        where: eq(accessTokens.teamId, team.id),
      })

    expect(response.status).toBe(200)

    const teamUsage = await container
      .make(TeamRepository)
      .usage(team.id)
      .get()

    expect(teamUsage.apiKey).toBeDefined()

    const decryptedApiKey = new Encryption(makeEnv().APP_KEY).decrypt(
      teamUsage.apiKey,
    )

    const verifiedToken = await container
      .resolve(AccessTokenRepository)
      .verifyToken(new Secret(decryptedApiKey?.release() as string))

    expect(verifiedToken).toBeDefined()
  })
})
