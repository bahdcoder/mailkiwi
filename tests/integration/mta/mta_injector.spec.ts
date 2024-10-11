import { apiEnv } from "@/api/env/api_env.js"
import { EmailSendRepository } from "@/email_sends/repositories/email_send_repository.js"
import { ProcessMtaLogJob } from "@/kumologs/jobs/process_mta_log_job.js"
import { faker } from "@faker-js/faker"
import { ServerType, serve } from "@hono/node-server"
import * as cheerio from "cheerio"
import { eq } from "drizzle-orm"
import { simpleParser } from "mailparser"
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  test,
} from "vitest"

import { CreateTeamAccessTokenAction } from "@/auth/actions/create_team_access_token.js"

import {
  clearAllMailpitMessages,
  getAllMailpitMessages,
  getMailpitMessageSource,
} from "@/tests/integration/helpers/mailpit.js"
import {
  createTestServer,
  shutdownTestServer,
} from "@/tests/integration/helpers/server.js"
import { getInjectEmailContent } from "@/tests/mocks/emails/email_content.js"
import { refreshRedisDatabase } from "@/tests/mocks/teams/teams.js"
import { setupDomainForDnsChecks } from "@/tests/unit/jobs/check_sending_domain_dns_configuration_job.spec.js"
import {
  getApiKeyForTeam,
  getCookieSessionForUser,
} from "@/tests/utils/http.js"

import { emailSends } from "@/database/schema/schema.js"

import {
  makeApp,
  makeDatabase,
  makeRedis,
} from "@/shared/container/index.js"
import { makeHttpClient } from "@/shared/http/http_client.js"
import { Queue } from "@/shared/queue/queue.js"
import { getAuthenticationHeaders } from "@/shared/utils/auth/get_auth_headers.js"
import { SignedUrlManager } from "@/shared/utils/links/signed_url_manager.js"

import { sleep } from "@/utils/sleep.js"
import { container } from "@/utils/typi.js"

describe.sequential("@mta", () => {
  let server: ServerType

  beforeAll(async () => {
    if (server) return

    server = await createTestServer()
  })

  afterAll(async () => {
    if (!server) return
    await shutdownTestServer(server)
  })

  test(
    "@mta-injector Http server can inject an HTTP message using API access token",
    { retry: 2 },
    async ({ expect }) => {
      const { TEST_DOMAIN, team } =
        await setupDomainForDnsChecks("localgmail.net")

      await clearAllMailpitMessages()

      const app = makeApp()

      const injectEmail = getInjectEmailContent(TEST_DOMAIN)

      const response = await app.request("/inject", {
        method: "POST",
        headers: {
          Authorization: await getApiKeyForTeam(team.id),
        },

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
    },
  )

  test(
    "@mta-log-processor server queues log processor jobs",
    { timeout: 10000, retry: 2 },
    async ({ expect }) => {
      const { TEST_DOMAIN, team } =
        await setupDomainForDnsChecks("localgmail.net")

      const app = makeApp()

      const injectEmail = getInjectEmailContent(TEST_DOMAIN)

      const response = await app.request("/inject", {
        method: "POST",
        headers: {
          Authorization: await getApiKeyForTeam(team.id),
        },
        body: JSON.stringify(injectEmail),
      })

      expect(response.status).toBe(200)

      await sleep(1000)

      const injectedRecipients = injectEmail.recipients
        ?.map((recipient) => recipient.email)
        .sort((A, B) => (A > B ? 1 : -1))

      const jobs = await Queue.mta_logs().getJobs()

      const logsJobs = jobs.filter((job) =>
        injectedRecipients.includes(job.data?.log?.recipient),
      )

      const deliveryLogs = logsJobs.filter(
        (job) => job.data.log.type === "Delivery",
      )

      const receptionLogs = logsJobs.filter(
        (job) => job.data.log.type === "Reception",
      )

      expect(logsJobs).toHaveLength(6)
      expect(deliveryLogs).toHaveLength(3)
      expect(receptionLogs).toHaveLength(3)
    },
  )

  test(
    "@mta-log-processor job processor stores all logs to the database",
    { timeout: 10000, retry: 2 },
    async ({ expect }) => {
      const { TEST_DOMAIN, team } =
        await setupDomainForDnsChecks("localgmail.net")

      const app = makeApp()

      const injectEmail = getInjectEmailContent(TEST_DOMAIN)

      const response = await app.request("/inject", {
        method: "POST",
        headers: {
          Authorization: await getApiKeyForTeam(team.id),
        },
        body: JSON.stringify(injectEmail),
      })

      expect(response.status).toBe(200)

      await sleep(1000)

      const jobs = await Queue.mta_logs().getJobs()

      const processLogJobs = jobs.filter(
        (job) => job.data.log.headers.Subject === injectEmail.subject,
      )

      expect(processLogJobs).toHaveLength(6)

      const database = makeDatabase()
      const redis = makeRedis()

      for (const job of processLogJobs) {
        await container
          .make(ProcessMtaLogJob)
          .handle({ payload: job.data, database, redis })
      }

      const emailSendId =
        processLogJobs?.[0]?.data?.log.headers?.[
          apiEnv.emailHeaders.emailSendId
        ]

      const allEmailSends = await container
        .make(EmailSendRepository)
        .findByIdWithEvents(emailSendId)

      expect(allEmailSends.sendingId).toBeDefined()
      expect(allEmailSends.events).toHaveLength(2)
      expect(allEmailSends.events.map((event) => event.type)).toEqual([
        "Delivery",
        "Reception",
      ])

      const deliveryEvent = allEmailSends.events.find(
        (event) => event.type === "Delivery",
      )
      const receptionEvent = allEmailSends.events.find(
        (event) => event.type === "Reception",
      )

      expect(deliveryEvent?.responseCode).toEqual(250)
      expect(deliveryEvent?.createdAt).toBeDefined()
      expect(deliveryEvent?.peerAddressName).toEqual(
        "mail.localgmail.net.",
      )

      expect(receptionEvent?.responseCode).toEqual(250)
      expect(receptionEvent?.createdAt).toBeDefined()
    },
  )

  test(
    "@mta-tracking-injection injects link tracking for messages",
    { timeout: 10000, retry: 2 },
    async ({ expect }) => {
      await clearAllMailpitMessages()
      const { TEST_DOMAIN, team, sendingDomain } =
        await setupDomainForDnsChecks("localgmail.net")

      const app = makeApp()

      const injectEmail = getInjectEmailContent(TEST_DOMAIN)

      const response = await app.request("/inject", {
        method: "POST",
        headers: {
          Authorization: await getApiKeyForTeam(team.id),
        },
        body: JSON.stringify(injectEmail),
      })

      expect(response.status).toBe(200)

      await sleep(1000)

      const messages = await getAllMailpitMessages()

      const messageIds = messages?.messages?.map(
        (message) => message.MessageID,
      )
      expect(messageIds).toHaveLength(3)

      expect(
        messageIds?.map((messageId) => messageId.split("@")[1]),
      ).toEqual([TEST_DOMAIN, TEST_DOMAIN, TEST_DOMAIN])

      for (const message of messages?.messages ?? []) {
        const { $ } = await getMailpitMessageSource(message?.ID)

        const links: string[] = []

        $("a").each(function (idx, element) {
          links.push($(element).attr("href") as string)
        })

        const trackingDomain = `https://${sendingDomain.trackingSubDomain}.${sendingDomain.name}/c/`

        for (const link of links) {
          expect(link).toContain(trackingDomain)

          const [, signedLink] = link.split(trackingDomain)

          const url = new SignedUrlManager(apiEnv.APP_KEY).decode(
            signedLink,
          )

          expect(url?.original).toBeDefined()
        }
      }
    },
  )
})
