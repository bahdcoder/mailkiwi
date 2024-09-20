import { injectorEnv } from "@/injector/env/injector_env.ts"
import { IgnitorMtaInjector } from "@/injector/ignitor/ignitor_injector.ts"
import { faker } from "@faker-js/faker"
import { describe, test } from "vitest"

import { CreateTeamAccessTokenAction } from "@/auth/actions/create_team_access_token.ts"

import { setupDomainForDnsChecks } from "@/tests/unit/jobs/check_sending_domain_dns_configuration_job.spec.ts"

import { makeMtaInjectorApp } from "@/shared/container/index.ts"
import { makeHttpClient } from "@/shared/http/http_client.ts"
import { getAuthenticationHeaders } from "@/shared/utils/auth/get_auth_headers.ts"
import { cuid } from "@/shared/utils/cuid/cuid.ts"

import { sleep } from "@/utils/sleep.ts"
import { container } from "@/utils/typi.ts"

new IgnitorMtaInjector().boot()

describe("@mta-injector Http server", () => {
  const clearAllMailpitMessages = async () => {
    await makeHttpClient()
      .url(`${injectorEnv.MAILPIT_API_URL}/api/v1/messages`)
      .delete()
      .send()
  }

  const getAllMailpitMessages = async () => {
    const { data } = await makeHttpClient<
      object,
      {
        total: number
        messages: {
          From: { Name: string; Address: string }
          To: { Name: string; Address: string }[]
          Cc: { Name: string; Address: string }[]
          Bcc: { Name: string; Address: string }[]
          ReplyTo: { Name: string; Address: string }[]
          Subject: String
        }[]
      }
    >()
      .url(`${injectorEnv.MAILPIT_API_URL}/api/v1/messages`)
      .get()
      .send()

    return data
  }

  test.only("can inject an HTTP message using API access token", async ({
    expect,
  }) => {
    const { TEST_DOMAIN, team } =
      await setupDomainForDnsChecks("localgmail.net")

    await clearAllMailpitMessages()

    const { accessSecret, accessKey } = await container
      .make(CreateTeamAccessTokenAction)
      .handle(team.id)

    const app = makeMtaInjectorApp()

    const injectEmail = {
      from: {
        name: faker.person.fullName(),
        email: cuid() + "@" + TEST_DOMAIN,
      },
      subject: faker.lorem.words(6),
      text: faker.lorem.paragraphs(12),
      replyTo: {
        name: faker.person.fullName(),
        email: cuid() + "@" + TEST_DOMAIN,
      },
      recipients: faker.helpers
        .multiple(() => faker.internet.email())
        .map(() => ({
          email: cuid() + "@" + TEST_DOMAIN,
          name: faker.person.fullName(),
        })),
    }

    const response = await app.request("/", {
      method: "POST",
      headers: getAuthenticationHeaders(accessKey, accessSecret.release()),
      body: JSON.stringify(injectEmail),
    })

    expect(response.status).toBe(200)

    await sleep(500)

    const messages = await getAllMailpitMessages()

    expect(messages?.messages).toHaveLength(3)

    const recipients = messages?.messages
      ?.map((message) => message?.To?.[0]?.Address)
      .sort((A, B) => (A > B ? 1 : -1))

    const injectedRecipients = injectEmail.recipients
      ?.map((recipient) => recipient.email)
      .sort((A, B) => (A > B ? 1 : -1))

    expect(recipients).toEqual(injectedRecipients)
  })
})
