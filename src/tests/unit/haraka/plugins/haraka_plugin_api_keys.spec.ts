import { eq } from "drizzle-orm"
import path from "path"
import { createClient } from "redis"
import { describe, test, vi } from "vitest"

import { CreateTeamAccessTokenAction } from "@/auth/actions/create_team_access_token.ts"

import { CreateSendingDomainAction } from "@/sending_domains/actions/create_sending_domain_action.ts"

import { createUser } from "@/tests/mocks/auth/users.ts"

import { sendingDomains } from "@/database/schema/schema.ts"

import {
  makeConfig,
  makeDatabase,
  makeEnv,
} from "@/shared/container/index.ts"
import { cuid } from "@/shared/utils/cuid/cuid.ts"
import { Encryption } from "@/shared/utils/encryption/encryption.ts"

import { container } from "@/utils/typi.ts"

describe("haraka plugin api keys", () => {
  const getApiKeysPlugin = () =>
    import(
      path.resolve(process.cwd(), "src/haraka/plugins/auth/api_keys.js")
    )

  test("checks team api key against shared redis database", async ({
    expect,
  }) => {
    const apiKeysPlugin = await getApiKeysPlugin()

    const { team, user } = await createUser()

    const accessToken = await container
      .make(CreateTeamAccessTokenAction)
      .handle(team.id)

    await container
      .make(CreateSendingDomainAction)
      .handle({ name: "newsletter.kibamail.com" }, team.id)

    const smtpUsername = team?.id
    const plainAccessToken = accessToken.toJSON()?.token

    const harakaRedisClient = await createClient({
      url: makeEnv().REDIS_URL,
    }).connect()

    let thisMock = {
      ...apiKeysPlugin,
      db: harakaRedisClient,
    }

    const mockConnection = {
      loginfo: vi.fn(),
      logerror: vi.fn(),
      notes: {} as Record<"team_usage", Record<string, string>>,
    }

    const callbackMock = vi.fn()

    await apiKeysPlugin.check_plain_passwd.bind(thisMock)(
      mockConnection,
      smtpUsername,
      plainAccessToken,
      callbackMock,
    )

    const config = makeConfig()
    const database = makeDatabase()

    const domain = await database.query.sendingDomains.findFirst({
      where: eq(sendingDomains.teamId, team.id),
    })

    const decryptedDomainPrivateKey = new Encryption(
      config.APP_KEY,
    ).decrypt(domain?.dkimPrivateKey as string)

    expect(mockConnection.notes.team_usage).toBeDefined()

    expect(mockConnection.notes.team_usage.returnPathSubDomain).toEqual(
      config.software.bounceSubdomain,
    )
    expect(
      mockConnection.notes.team_usage.returnPathDomainCnameValue,
    ).toEqual(config.software.bounceHost)
    expect(
      mockConnection.notes.team_usage.decrypted_dkim_private_key,
    ).toEqual(decryptedDomainPrivateKey?.release())

    expect(callbackMock).toHaveBeenCalledWith(true)
  })

  test("returns false if api key provided is invalid", async ({
    expect,
  }) => {
    const apiKeysPlugin = await getApiKeysPlugin()

    const smtpUsername = cuid()
    const plainAccessToken = cuid()

    const harakaRedisClient = await createClient({
      url: makeEnv().REDIS_URL,
    }).connect()

    let thisMock = {
      ...apiKeysPlugin,
      db: harakaRedisClient,
    }

    const mockConnection = {
      loginfo: vi.fn(),
      logerror: vi.fn(),
      notes: {} as Record<"team_usage", Record<string, string>>,
    }

    const callbackMock = vi.fn()

    await apiKeysPlugin.check_plain_passwd.bind(thisMock)(
      mockConnection,
      smtpUsername,
      plainAccessToken,
      callbackMock,
    )

    expect(callbackMock).toHaveBeenCalledWith(false)
    expect(mockConnection.loginfo.mock.calls[2][1]).toEqual(
      `No API key found for username: ${smtpUsername}`,
    )
  })
})
