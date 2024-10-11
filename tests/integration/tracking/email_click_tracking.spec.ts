import { apiEnv } from "@/api/env/api_env.js"
import { ServerType } from "@hono/node-server"
import { afterAll, beforeAll, describe, test } from "vitest"

import {
  getAllMailpitMessages,
  getMailpitMessageSource,
} from "@/tests/integration/helpers/mailpit.js"
import {
  createTestServer,
  shutdownTestServer,
} from "@/tests/integration/helpers/server.js"
import { injectEmailForTeam } from "@/tests/mocks/emails/email_content.js"
import { setupDomainForDnsChecks } from "@/tests/unit/jobs/check_sending_domain_dns_configuration_job.spec.js"

import { makeApp } from "@/shared/container/index.js"
import { SignedUrlManager } from "@/shared/utils/links/signed_url_manager.js"

import { sleep } from "@/utils/sleep.js"

describe.sequential("@tracking", () => {
  let server: ServerType

  beforeAll(async () => {
    if (server) return

    server = await createTestServer()
  })

  afterAll(async () => {
    if (!server) return
    await shutdownTestServer(server)
  })

  test("tracks a click event and redirects to original url", async ({
    expect,
  }) => {
    //
    const app = makeApp()
    const { TEST_DOMAIN, team, sendingDomain } =
      await setupDomainForDnsChecks("localgmail.net")

    const { response, injectEmail } = await injectEmailForTeam(
      team.id,
      TEST_DOMAIN,
    )

    await sleep(2000)

    const { messages: allMessages } = await getAllMailpitMessages()

    const [message] = allMessages?.filter(
      (message) => message.Subject === injectEmail.subject,
    )

    const { $ } = await getMailpitMessageSource(message.ID)

    const links: string[] = []

    $("a").each(function (idx, element) {
      links.push($(element).attr("href") as string)
    })

    for (const link of links) {
      const [, signature] = link.split("/c/")

      const response = await app.request(`/c/${signature}`)

      const unsigned = new SignedUrlManager(apiEnv.APP_KEY).decode(
        signature,
      )

      expect(response.status).toEqual(302)
      expect(response.headers.get("Location")).toEqual(unsigned?.original)
    }
  })

  test("any tampered signatures redirect to kibamail home page without tracking", async ({
    expect,
  }) => {
    const app = makeApp()

    const response = await app.request("/c/1234")

    expect(response.status).toBe(302)
    expect(response.headers.get("Location")).toEqual(
      "https://kibamail.com",
    )
  })
})
