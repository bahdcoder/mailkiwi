import { apiEnv } from "@/api/env/api_env.js"
import { describe, test } from "vitest"

import { CreateTeamAccessTokenAction } from "@/auth/actions/create_team_access_token.js"

import { SendingDomainRepository } from "@/sending_domains/repositories/sending_domain_repository.js"

import { setupDomainForDnsChecks } from "@/tests/unit/jobs/check_sending_domain_dns_configuration_job.spec.js"
import { getCookieSessionForUser } from "@/tests/utils/http.js"

import { makeApp } from "@/shared/container/index.js"

import { container } from "@/utils/typi.js"

describe("@mta Http server", () => {
  test("can fetch dkim records for a domain", async ({ expect }) => {
    const { TEST_DOMAIN } = await setupDomainForDnsChecks()

    const app = makeApp()

    const response = await app.request("/mta/dkim", {
      method: "POST",
      headers: {
        "x-mta-access-token": apiEnv.MTA_ACCESS_TOKEN.release(),
      },
      body: JSON.stringify({ domain: TEST_DOMAIN }),
    })

    const json = await response.json()

    expect(json.returnPathSubDomain).toBe("kb")
    expect(json.dkimSubDomain).toContain("._domainkey")
    expect(json.privateKey).toMatch("-----BEGIN PRIVATE KEY-----")
    expect(json.privateKey).toMatch("-----END PRIVATE KEY-----")

    expect(json.engage.primary.source_address).toBeDefined()
    expect(json.engage.secondary.source_address).toBeDefined()
    expect(json.send.primary.source_address).toBeDefined()
    expect(json.send.secondary.source_address).toBeDefined()
  })

  test("cannot fetch dkim records without valid access token", async ({
    expect,
  }) => {
    const { TEST_DOMAIN } = await setupDomainForDnsChecks()

    const app = makeApp()

    const response = await app.request("/mta/dkim", {
      method: "POST",
      body: JSON.stringify({ domain: TEST_DOMAIN }),
    })

    const json = await response.json()

    expect(json).toEqual({ status: "failed" })
  })

  test("can authenticate smtp credentials", async ({ expect }) => {
    const { team } = await setupDomainForDnsChecks()

    const { apiKey } = await container
      .make(CreateTeamAccessTokenAction)
      .handle(team.id)

    const app = makeApp()

    const response = await app.request("/mta/smtp/auth", {
      method: "POST",
      body: JSON.stringify({
        passwd: apiKey,
        username: apiKey,
      }),
      headers: {
        "x-mta-access-token": apiEnv.MTA_ACCESS_TOKEN.release(),
      },
    })

    expect(await response.json()).toEqual({ status: "success" })
  })

  test("authenticating with wrong credentials fails", async ({
    expect,
  }) => {
    const { team } = await setupDomainForDnsChecks()

    const { apiKey } = await container
      .make(CreateTeamAccessTokenAction)
      .handle(team.id)

    const app = makeApp()

    const response = await app.request("/mta/smtp/auth", {
      method: "POST",
      body: JSON.stringify({
        passwd: "wrong-api-key",
        username: apiKey,
      }),
      headers: {
        "x-mta-access-token": apiEnv.MTA_ACCESS_TOKEN.release(),
      },
    })

    expect(await response.json()).toEqual({ status: "failed" })
  })
})
