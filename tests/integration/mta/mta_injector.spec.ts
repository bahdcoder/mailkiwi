import { apiEnv } from "@/api/env/api_env.js"
import { EmailSendRepository } from "@/email_sends/repositories/email_send_repository.js"
import { ProcessMtaLogJob } from "@/kumologs/jobs/process_mta_log_job.js"
import { ServerType, serve } from "@hono/node-server"
import { afterAll, beforeAll, describe, test } from "vitest"

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
import { injectEmailForTeam } from "@/tests/mocks/emails/email_content.js"
import { setupDomainForDnsChecks } from "@/tests/unit/jobs/check_sending_domain_dns_configuration_job.spec.js"
import { getApiKeyForTeam } from "@/tests/utils/http.js"

import {
  makeApp,
  makeDatabase,
  makeRedis,
} from "@/shared/container/index.js"
import { Queue } from "@/shared/queue/queue.js"
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

describe.sequential("@click-tracking", () => {
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
    const { TEST_DOMAIN, team } =
      await setupDomainForDnsChecks("localgmail.net")

    const { injectEmail } = await injectEmailForTeam(team.id, TEST_DOMAIN)

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

  test("does not track links with disable-tracking attribute", async ({
    expect,
  }) => {
    //
    const app = makeApp()
    const { TEST_DOMAIN, team } =
      await setupDomainForDnsChecks("localgmail.net")

    const linkInEmail = "https://google.com"

    const { injectEmail } = await injectEmailForTeam(
      team.id,
      TEST_DOMAIN,
      {
        html: `<a href="${linkInEmail}" disable-tracking="true">View my home page.</a>`,
      },
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

    expect(links).toEqual([linkInEmail])
  })

  test("enabling link tracking for a specific email overrides domain configuration", async ({
    expect,
  }) => {
    //
    const app = makeApp()
    const { TEST_DOMAIN, team, sendingDomain } =
      await setupDomainForDnsChecks("localgmail.net", {
        clickTrackingEnabled: false,
      })

    const linkInEmail = "https://google.com"

    const { injectEmail } = await injectEmailForTeam(
      team.id,
      TEST_DOMAIN,
      {
        html: `<a href="${linkInEmail}">View my home page.</a>`,
        clickTrackingEnabled: true,
      },
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

    expect(links[0]).toContain(
      `https://${sendingDomain.trackingSubDomain}.${sendingDomain.name}/c/`,
    )
  })
})

describe.sequential("@open-tracking", () => {
  let server: ServerType

  beforeAll(async () => {
    if (server) return

    server = await createTestServer()
  })

  afterAll(async () => {
    if (!server) return
    await shutdownTestServer(server)
  })

  test("tracks when an email is opened", async ({ expect }) => {
    //
    const app = makeApp()
    const { TEST_DOMAIN, team, sendingDomain } =
      await setupDomainForDnsChecks("localgmail.net")

    const { injectEmail } = await injectEmailForTeam(team.id, TEST_DOMAIN)

    await sleep(2000)

    const { messages: allMessages } = await getAllMailpitMessages()

    const [message] = allMessages?.filter(
      (message) => message.Subject === injectEmail.subject,
    )

    const { $ } = await getMailpitMessageSource(message.ID)

    const imageSources: string[] = []

    $("img").each(function (_, element) {
      imageSources.push($(element).attr("src") as string)
    })

    const sendingDomainLink = `https://${sendingDomain.trackingSubDomain}.${sendingDomain.name}/o/`

    const trackingLink = imageSources.find((source) =>
      source.includes(sendingDomainLink),
    ) as string

    const [, signature] = trackingLink?.split(sendingDomainLink)

    const unsigned = new SignedUrlManager(apiEnv.APP_KEY).decode(signature)

    expect(unsigned?.original).toBeDefined()

    const emailSend = await container
      .make(EmailSendRepository)
      .findById(unsigned?.original as string)

    expect(emailSend).toBeDefined()

    const response = await app.request(`/o/${signature}`)

    expect(response.status).toBe(200)
    expect(response.headers.get("Content-Type")).toEqual("image/png")
  })

  test("does not track opens when open tracking is disabled", async ({
    expect,
  }) => {
    const app = makeApp()
    const { TEST_DOMAIN, team } =
      await setupDomainForDnsChecks("localgmail.net")

    const linkInEmail = "https://google.com"

    const { injectEmail } = await injectEmailForTeam(
      team.id,
      TEST_DOMAIN,
      {
        html: `<a href="${linkInEmail}" disable-tracking="true">View my home page.</a>`,
        openTrackingEnabled: false,
      },
    )

    await sleep(2000)

    const { messages: allMessages } = await getAllMailpitMessages()

    const [message] = allMessages?.filter(
      (message) => message.Subject === injectEmail.subject,
    )

    const { $ } = await getMailpitMessageSource(message.ID)

    const images: string[] = []

    $("img").each(function (idx, element) {
      images.push($(element).attr("src") as string)
    })

    expect(images).toHaveLength(0)
  })

  test("can track opens for an email even when tracking is disabled for domain", async ({
    expect,
  }) => {
    const app = makeApp()
    const { TEST_DOMAIN, team, sendingDomain } =
      await setupDomainForDnsChecks("localgmail.net", {
        openTrackingEnabled: false,
        clickTrackingEnabled: false,
      })

    const linkInEmail = "https://google.com"

    const { injectEmail } = await injectEmailForTeam(
      team.id,
      TEST_DOMAIN,
      {
        html: `<a href="${linkInEmail}" disable-tracking="true">View my home page.</a>`,
        openTrackingEnabled: true,
      },
    )

    await sleep(2000)

    const { messages: allMessages } = await getAllMailpitMessages()

    const [message] = allMessages?.filter(
      (message) => message.Subject === injectEmail.subject,
    )

    const { $ } = await getMailpitMessageSource(message.ID)

    const images: string[] = []

    $("img").each(function (idx, element) {
      images.push($(element).attr("src") as string)
    })

    expect(images).toHaveLength(1)
    expect(images[0]).toMatch(
      `https://${sendingDomain.trackingSubDomain}.${sendingDomain.name}/o/`,
    )
  })
})
