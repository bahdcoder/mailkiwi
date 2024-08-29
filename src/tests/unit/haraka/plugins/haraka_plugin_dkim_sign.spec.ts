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

describe("haraka plugin dkim sign", () => {
  const getDkimSignPlugin = () =>
    import(
      path.resolve(process.cwd(), "src/haraka/plugins/dkim/dkim_sign.js")
    )

  test("signs the email using the private keys in connection notes", async ({
    expect,
  }) => {
    const dkimSignPlugin = await getDkimSignPlugin()

    const mockConnection = {
      loginfo: vi.fn(),
      logerror: vi.fn(),
      transaction: {
        mail_from: {
          host: "newsletter.kibamail.com",
        },
        results: {
          add: vi.fn(),
        },
        notes: {
          forward: true,
        },
      },
      notes: {
        team_usage: {
          dkimSubDomain: cuid(),
          decrypted_dkim_private_key: cuid(),
        },
      } as Record<"team_usage", Record<string, string>>,
    }

    const callbackMock = vi.fn()

    await dkimSignPlugin.get_sign_properties.bind(dkimSignPlugin)(
      mockConnection,
      callbackMock,
    )

    expect(callbackMock).toHaveBeenCalledWith(null, {
      domain: "newsletter.kibamail.com",
      private_key:
        mockConnection.notes.team_usage.decrypted_dkim_private_key,
      selector: mockConnection.notes.team_usage.dkimSubDomain,
    })
  })
})
