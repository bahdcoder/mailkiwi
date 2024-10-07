import { apiEnv } from "@/api/env/api_env.js"
import { EmailSendRepository } from "@/email_sends/repositories/email_send_repository.js"
import { ProcessMtaLogJob } from "@/kumologs/jobs/process_mta_log_job.js"
import { faker } from "@faker-js/faker"
import { ServerType, serve } from "@hono/node-server"
import { eq } from "drizzle-orm"
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  test,
} from "vitest"

import { CreateTeamAccessTokenAction } from "@/auth/actions/create_team_access_token.js"

import { getInjectEmailContent } from "@/tests/mocks/emails/email_content.js"
import { refreshRedisDatabase } from "@/tests/mocks/teams/teams.js"
import { setupDomainForDnsChecks } from "@/tests/unit/jobs/check_sending_domain_dns_configuration_job.spec.js"

import { emailSends } from "@/database/schema/schema.js"

import {
  makeApp,
  makeDatabase,
  makeRedis,
} from "@/shared/container/index.js"
import { makeHttpClient } from "@/shared/http/http_client.js"
import { Queue } from "@/shared/queue/queue.js"
import { getAuthenticationHeaders } from "@/shared/utils/auth/get_auth_headers.js"

import { sleep } from "@/utils/sleep.js"
import { container } from "@/utils/typi.js"

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

describe.sequential("@mta", () => {
  let server: ServerType

  beforeAll(async () => {
    const app = makeApp()

    if (server) return

    server = serve(
      {
        fetch: app.fetch,
        port: apiEnv.PORT,
      },
      ({ address, port }) => {
        console.log(
          `@inject-tests: monolith api running on: ${address}:${port}`,
        )
      },
    )

    await new Promise(function (resolve, reject) {
      server.on("listening", () => {
        resolve("Port listening.")
      })

      server.on("timeout", reject)
    })

    await sleep(1000)
  })

  afterAll(async () => {
    if (!server) return
    await new Promise(function (resolve, reject) {
      server.close(function (error) {
        if (error) return reject(error)

        console.log(`@inject-tests: monolith api closed.`)

        resolve({})
      })
    })

    await sleep(1000)
  })

  test(
    "@mta-injector Http server can inject an HTTP message using API access token",
    { retry: 2 },
    async ({ expect }) => {
      const { TEST_DOMAIN, team } =
        await setupDomainForDnsChecks("localgmail.net")

      await clearAllMailpitMessages()

      const { apiKey } = await container
        .make(CreateTeamAccessTokenAction)
        .handle(team.id)

      const app = makeApp()

      const injectEmail = getInjectEmailContent(TEST_DOMAIN)

      const response = await app.request("/inject", {
        method: "POST",
        headers: getAuthenticationHeaders(apiKey),
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

      const { apiKey } = await container
        .make(CreateTeamAccessTokenAction)
        .handle(team.id)

      const app = makeApp()

      const injectEmail = getInjectEmailContent(TEST_DOMAIN)

      const response = await app.request("/inject", {
        method: "POST",
        headers: getAuthenticationHeaders(apiKey),
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

      const { apiKey } = await container
        .make(CreateTeamAccessTokenAction)
        .handle(team.id)

      const app = makeApp()

      const injectEmail = getInjectEmailContent(TEST_DOMAIN)

      const response = await app.request("/inject", {
        method: "POST",
        headers: getAuthenticationHeaders(apiKey),
        body: JSON.stringify(injectEmail),
      })

      expect(response.status).toBe(200)

      await sleep(1000)

      const jobs = await Queue.mta_logs().getJobs()

      const processLogJobs = jobs.filter(
        (job) => job.data.log.sender === injectEmail.from.email,
      )

      const database = makeDatabase()
      const redis = makeRedis()

      for (const job of processLogJobs) {
        await container
          .make(ProcessMtaLogJob)
          .handle({ payload: job.data, database, redis })
      }

      const allEmailSends = await container
        .make(EmailSendRepository)
        .findBySendingIdWithEvents(processLogJobs?.[0]?.data?.log?.id)

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

  test.only(
    "@mta-tracking-injection injects link tracking for messages",
    { timeout: 10000, retry: 2 },
    async ({ expect }) => {
      const { TEST_DOMAIN, team } =
        await setupDomainForDnsChecks("localgmail.net")

      const { apiKey } = await container
        .make(CreateTeamAccessTokenAction)
        .handle(team.id)

      const app = makeApp()

      const injectEmail = getInjectEmailContent(TEST_DOMAIN)

      const response = await app.request("/inject", {
        method: "POST",
        headers: getAuthenticationHeaders(apiKey),
        body: JSON.stringify(injectEmail),
      })

      expect(response.status).toBe(200)

      return

      await sleep(1000)

      const jobs = await Queue.mta_logs().getJobs()

      const processLogJobs = jobs.filter(
        (job) => job.data.log.sender === injectEmail.from.email,
      )

      const database = makeDatabase()
      const redis = makeRedis()

      for (const job of processLogJobs) {
        await container
          .make(ProcessMtaLogJob)
          .handle({ payload: job.data, database, redis })
      }

      const allEmailSends = await container
        .make(EmailSendRepository)
        .findBySendingIdWithEvents(processLogJobs?.[0]?.data?.log?.id)

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
})
