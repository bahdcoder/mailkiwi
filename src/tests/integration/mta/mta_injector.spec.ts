import { apiEnv } from "@/api/env/api_env.js"
import { faker } from "@faker-js/faker"
import { serve } from "@hono/node-server"
import { describe, test } from "vitest"

import { CreateTeamAccessTokenAction } from "@/auth/actions/create_team_access_token.js"

import { getInjectEmailContent } from "@/tests/mocks/emails/email_content.js"
import { setupDomainForDnsChecks } from "@/tests/unit/jobs/check_sending_domain_dns_configuration_job.spec.js"

import { makeApp } from "@/shared/container/index.js"
import { makeHttpClient } from "@/shared/http/http_client.js"
import { Queue } from "@/shared/queue/queue.js"
import { getAuthenticationHeaders } from "@/shared/utils/auth/get_auth_headers.js"
import { cuid } from "@/shared/utils/cuid/cuid.js"

import { sleep } from "@/utils/sleep.js"
import { container } from "@/utils/typi.js"

describe("@mta", () => {
  describe("@mta-injector Http server", () => {
    const clearAllMailpitMessages = async () => {
      await makeHttpClient()
        .url(`${apiEnv.MAILPIT_API_URL}/api/v1/messages`)
        .delete()
        .send()
    }

    type Envelope = {
      Name: string
      Address: string
    }

    const getAllMailpitMessages = async () => {
      const { data } = await makeHttpClient<
        object,
        {
          total: number
          messages: {
            From: Envelope
            To: Envelope[]
            Cc: Envelope[]
            Bcc: Envelope[]
            ReplyTo: Envelope[]
            Subject: String
          }[]
        }
      >()
        .url(`${apiEnv.MAILPIT_API_URL}/api/v1/messages`)
        .get()
        .send()

      return data
    }

    test("can inject an HTTP message using API access token", async ({
      expect,
    }) => {
      const { TEST_DOMAIN, team } =
        await setupDomainForDnsChecks("localgmail.net")

      await clearAllMailpitMessages()

      const { accessSecret, accessKey } = await container
        .make(CreateTeamAccessTokenAction)
        .handle(team.id)

      const app = makeApp()

      const server = serve({
        fetch: app.fetch,
        port: apiEnv.PORT,
      })

      await new Promise(function (resolve, reject) {
        server.on("listening", () => {
          resolve("Port listening.")
        })

        server.on("timeout", reject)
      })

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
        headers: getAuthenticationHeaders(
          accessKey,
          accessSecret.release(),
        ),
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

      server.close()
    })
  })

  describe("@mta-log-processor server", () => {
    test(
      "queues log processor jobs",
      { timeout: 10000 },
      async ({ expect }) => {
        const { TEST_DOMAIN, team } =
          await setupDomainForDnsChecks("localgmail.net")

        const { accessSecret, accessKey } = await container
          .make(CreateTeamAccessTokenAction)
          .handle(team.id)

        const app = makeApp()

        const server = serve({
          fetch: app.fetch,
          port: apiEnv.PORT,
        })

        await new Promise(function (resolve, reject) {
          server.on("listening", () => {
            resolve("Port listening.")
          })

          server.on("timeout", reject)
        })

        const injectEmail = getInjectEmailContent(TEST_DOMAIN)

        const response = await app.request("/", {
          method: "POST",
          headers: getAuthenticationHeaders(
            accessKey,
            accessSecret.release(),
          ),
          body: JSON.stringify(injectEmail),
        })

        expect(response.status).toBe(200)

        await sleep(4000)

        const injectedRecipients = injectEmail.recipients
          ?.map((recipient) => recipient.email)
          .sort((A, B) => (A > B ? 1 : -1))

        const jobs = await Queue.mta_logs().getJobs()

        const logsJobs = jobs.filter((job) =>
          injectedRecipients.includes(job.data.recipient),
        )

        const deliveryLogs = logsJobs.filter(
          (log) => log.data.type === "Delivery",
        )

        const receptionLogs = logsJobs.filter(
          (log) => log.data.type === "Reception",
        )

        expect(logsJobs).toHaveLength(6)
        expect(deliveryLogs).toHaveLength(3)
        expect(receptionLogs).toHaveLength(3)

        server.close()
      },
    )
  })
})
