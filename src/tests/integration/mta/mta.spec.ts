import { IgnitorMtaHelper } from "@/boot/ignitor_mta_helper.ts"
import { describe, test } from "vitest"

import { CreateTeamAccessTokenAction } from "@/auth/actions/create_team_access_token.ts"

import { setupDomainForDnsChecks } from "@/tests/unit/jobs/check_sending_domain_dns_configuration_job.spec.ts"

import { makeEnv, makeMtaHelperApp } from "@/shared/container/index.ts"

import { container } from "@/utils/typi.ts"

new IgnitorMtaHelper().boot()

describe("@mta Http server", () => {
  test("can fetch dkim records for a domain", async ({ expect }) => {
    const { TEST_DOMAIN } = await setupDomainForDnsChecks()

    const app = makeMtaHelperApp()

    const response = await app.request("/dkim", {
      method: "POST",
      headers: {
        "x-mta-access-token": makeEnv().MTA_ACCESS_TOKEN.release(),
      },
      body: JSON.stringify({ domain: TEST_DOMAIN }),
    })

    const json = await response.json()

    expect(json.returnPathSubDomain).toBe("kb")
    expect(json.dkimSubDomain).toContain("._domainkey")
    expect(json.privateKey).toMatch("-----BEGIN PRIVATE KEY-----")
    expect(json.privateKey).toMatch("-----END PRIVATE KEY-----")
  })

  test("cannot fetch dkim records without valid access token", async ({
    expect,
  }) => {
    const { TEST_DOMAIN } = await setupDomainForDnsChecks()

    const app = makeMtaHelperApp()

    const response = await app.request("/dkim", {
      method: "POST",
      body: JSON.stringify({ domain: TEST_DOMAIN }),
    })

    const json = await response.json()

    expect(json).toEqual({ status: "failed" })
  })

  test("can authenticate smtp credentials", async ({ expect }) => {
    const { team } = await setupDomainForDnsChecks()

    const { accessToken, username } = await container
      .make(CreateTeamAccessTokenAction)
      .handle(team.id)

    const apiKey = accessToken.toJSON().token as string

    const app = makeMtaHelperApp()

    const response = await app.request("/smtp/auth", {
      method: "POST",
      body: JSON.stringify({
        passwd: apiKey,
        username,
      }),
      headers: {
        "x-mta-access-token": makeEnv().MTA_ACCESS_TOKEN.release(),
      },
    })

    expect(await response.json()).toEqual({ status: "success" })
  })

  test("authenticating with wrong credentials fails", async ({
    expect,
  }) => {
    const { team } = await setupDomainForDnsChecks()

    const { username } = await container
      .make(CreateTeamAccessTokenAction)
      .handle(team.id)

    const app = makeMtaHelperApp()

    const response = await app.request("/smtp/auth", {
      method: "POST",
      body: JSON.stringify({
        passwd: "wrong-api-key",
        username,
      }),
      headers: {
        "x-mta-access-token": makeEnv().MTA_ACCESS_TOKEN.release(),
      },
    })

    expect(await response.json()).toEqual({ status: "failed" })
  })
})
