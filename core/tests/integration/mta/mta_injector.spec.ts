import { appEnv } from '#root/core/app/env/app_env.js'
import { EmailSendRepository } from '#root/core/email_sends/repositories/email_send_repository.js'
import { ProcessMtaLogJob } from '#root/core/kumologs/jobs/process_mta_log_job.js'
import type { ServerType } from '@hono/node-server'
import { v1 } from 'uuid'
import { afterAll, beforeAll, describe, test } from 'vitest'

import { SendBroadcastToContact } from '#root/core/broadcasts/jobs/send_broadcast_to_contact_job.js'

import { ContactRepository } from '#root/core/audiences/repositories/contact_repository.js'
import { SenderIdentityRepository } from '#root/core/sending_domains/repositories/sender_identity_repository.js'

import {
  clearAllMailpitMessages,
  getAllMailpitMessages,
  getMailpitMessageSource,
} from '#root/core/tests/integration/helpers/mailpit.js'
import {
  createTestServer,
  shutdownTestServer,
} from '#root/core/tests/integration/helpers/server.js'
import { createBroadcastForUser, createUser } from '#root/core/tests/mocks/auth/users.js'
import { getInjectEmailContent } from '#root/core/tests/mocks/emails/email_content.js'
import { injectEmailForTeam } from '#root/core/tests/mocks/emails/email_content.js'
import { getApiKeyForTeam } from '#root/core/tests/utils/http.js'

import type { Audience } from '#root/database/database_schema_types.js'

import {
  makeApp,
  makeDatabase,
  makeLogger,
  makeRedis,
} from '#root/core/shared/container/index.js'
import { Queue } from '#root/core/shared/queue/queue.js'
import { SignedUrlManager } from '#root/core/shared/utils/links/signed_url_manager.js'

import { sleep } from '#root/core/utils/sleep.js'
import { container } from '#root/core/utils/typi.js'
import { setupDomainForDnsChecks } from '#root/core/tests/unit/helpers/domains/setup_domain_for_dns_checks.js'

const xForwardedFor = '66.249.93.66'
const userAgent =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36'

describe.sequential.skip('@mta', () => {
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
    '@mta-injector Http server can inject an HTTP message using API access token',
    { retry: 2 },
    async ({ expect }) => {
      const { TEST_DOMAIN, team } = await setupDomainForDnsChecks('localgmail.net')

      await clearAllMailpitMessages()

      const app = makeApp()

      const injectEmail = getInjectEmailContent(TEST_DOMAIN)

      const response = await app.request('/inject', {
        method: 'POST',
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
    '@mta-log-processor server queues log processor jobs',
    { timeout: 10000, retry: 2 },
    async ({ expect }) => {
      const { TEST_DOMAIN, team } = await setupDomainForDnsChecks('localgmail.net')

      const app = makeApp()

      const injectEmail = getInjectEmailContent(TEST_DOMAIN)

      const response = await app.request('/inject', {
        method: 'POST',
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

      const deliveryLogs = logsJobs.filter((job) => job.data.log.type === 'Delivery')

      const receptionLogs = logsJobs.filter((job) => job.data.log.type === 'Reception')

      expect(logsJobs).toHaveLength(6)
      expect(deliveryLogs).toHaveLength(3)
      expect(receptionLogs).toHaveLength(3)
    },
  )

  test(
    '@mta-log-processor job processor stores all logs to the database',
    { timeout: 10000, retry: 2 },
    async ({ expect }) => {
      const { TEST_DOMAIN, team } = await setupDomainForDnsChecks('localgmail.net')

      const app = makeApp()

      const injectEmail = getInjectEmailContent(TEST_DOMAIN)

      const response = await app.request('/inject', {
        method: 'POST',
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
          .handle({ payload: job.data, database, redis, logger: makeLogger() })
      }

      const emailSendId =
        processLogJobs?.[0]?.data?.log.headers?.[appEnv.emailHeaders.emailSendId]

      const allEmailSends = await container
        .make(EmailSendRepository)
        .findByIdWithEvents(emailSendId)

      expect(allEmailSends.sendingId).toBeDefined()
      expect(allEmailSends.events).toHaveLength(2)
      expect(allEmailSends.events.map((event) => event.type)).toEqual([
        'Delivery',
        'Reception',
      ])

      const deliveryEvent = allEmailSends.events.find(
        (event) => event.type === 'Delivery',
      )
      const receptionEvent = allEmailSends.events.find(
        (event) => event.type === 'Reception',
      )

      expect(deliveryEvent?.responseCode).toEqual(250)
      expect(deliveryEvent?.createdAt).toBeDefined()
      expect(deliveryEvent?.peerAddressName).toEqual('mail.localgmail.net.')

      expect(receptionEvent?.responseCode).toEqual(250)
      expect(receptionEvent?.createdAt).toBeDefined()
    },
  )

  test(
    '@mta-tracking-injection injects link tracking for messages',
    { timeout: 10000, retry: 2 },
    async ({ expect }) => {
      await clearAllMailpitMessages()
      const { TEST_DOMAIN, team, sendingDomain } =
        await setupDomainForDnsChecks('localgmail.net')

      const app = makeApp()

      const injectEmail = getInjectEmailContent(TEST_DOMAIN)

      const response = await app.request('/inject', {
        method: 'POST',
        headers: {
          Authorization: await getApiKeyForTeam(team.id),
        },
        body: JSON.stringify(injectEmail),
      })

      expect(response.status).toBe(200)

      await sleep(1000)

      const messages = await getAllMailpitMessages()

      const messageIds = messages?.messages?.map((message) => message.MessageID)
      expect(messageIds).toHaveLength(3)

      expect(messageIds?.map((messageId) => messageId.split('@')[1])).toEqual([
        TEST_DOMAIN,
        TEST_DOMAIN,
        TEST_DOMAIN,
      ])

      for (const message of messages?.messages ?? []) {
        const { $ } = await getMailpitMessageSource(message?.ID)

        const links: string[] = []

        $('a').each((idx, element) => {
          links.push($(element).attr('href') as string)
        })

        const trackingDomain = `https://${sendingDomain.trackingSubDomain}.${sendingDomain.name}/c/`

        for (const link of links) {
          expect(link).toContain(trackingDomain)

          const [, signedLink] = link.split(trackingDomain)

          const url = new SignedUrlManager(appEnv.APP_KEY).decode(signedLink)

          expect(url?.original).toBeDefined()
        }
      }
    },
  )

  test('@click-tracking tracks a click event and redirects to original url', async ({
    expect,
  }) => {
    //
    const app = makeApp()
    const { TEST_DOMAIN, team } = await setupDomainForDnsChecks('localgmail.net')

    const { injectEmail, response } = await injectEmailForTeam(team.id, TEST_DOMAIN)

    const json = await response.json()

    // biome-ignore lint/suspicious/noExplicitAny: API response type
    const messageIds = json.messages.map((message: any) => message.messageId)

    await sleep(2000)

    const { messages: allMessages } = await getAllMailpitMessages()

    const [message] = allMessages
      ? allMessages.filter((message) => message.Subject === injectEmail.subject)
      : []

    const { $ } = await getMailpitMessageSource(message.ID)

    const links: string[] = []

    $('a').each((idx, element) => {
      links.push($(element).attr('href') as string)
    })

    for (const link of links) {
      const [, signature] = link.split('/c/')

      const response = await app.request(`/c/${signature}`, {
        headers: {
          'x-forwarded-for': xForwardedFor,
          'user-agent': userAgent,
        },
      })

      const unsigned = new SignedUrlManager(appEnv.APP_KEY).decode(signature)

      expect(response.status).toEqual(302)
      expect(response.headers.get('Location')).toEqual(unsigned?.original)
    }

    const jobs = await Queue.mta_logs().getJobs()

    const clickJobs = jobs
      .filter(
        (job) =>
          messageIds.includes(job.data.log?.headers?.[appEnv.emailHeaders.emailSendId]) &&
          job.data.log?.type === 'Click',
      )
      .map((job) => job.data.log)

    for (const job of clickJobs) {
      expect(job.ipv4_address).toEqual(xForwardedFor)
      expect(job.user_agent).toEqual(userAgent)
      expect(job.timestamp).toBeDefined()
    }
  })

  test('@click-tracking any tampered signatures redirect to kibamail home page without tracking', async ({
    expect,
  }) => {
    const app = makeApp()

    const response = await app.request('/c/1234')

    expect(response.status).toBe(302)
    expect(response.headers.get('Location')).toEqual('https://kibamail.com')
  })

  test('@click-tracking does not track links with disable-tracking attribute', async ({
    expect,
  }) => {
    //
    const app = makeApp()
    const { TEST_DOMAIN, team } = await setupDomainForDnsChecks('localgmail.net')

    const linkInEmail = 'https://google.com'

    const { injectEmail } = await injectEmailForTeam(team.id, TEST_DOMAIN, {
      html: `<a href="${linkInEmail}" disable-tracking="true">View my home page.</a>`,
    })

    await sleep(2000)

    const { messages: allMessages } = await getAllMailpitMessages()

    const [message] = allMessages
      ? allMessages.filter((message) => message.Subject === injectEmail.subject)
      : []

    const { $ } = await getMailpitMessageSource(message.ID)

    const links: string[] = []

    $('a').each((idx, element) => {
      links.push($(element).attr('href') as string)
    })

    expect(links).toEqual([linkInEmail])
  })

  test('@click-tracking enabling link tracking for a specific email overrides domain configuration', async ({
    expect,
  }) => {
    //
    const app = makeApp()
    const { TEST_DOMAIN, team, sendingDomain } = await setupDomainForDnsChecks(
      'localgmail.net',
      {
        clickTrackingEnabled: false,
      },
    )

    const linkInEmail = 'https://google.com'

    const { injectEmail } = await injectEmailForTeam(team.id, TEST_DOMAIN, {
      html: `<a href="${linkInEmail}">View my home page.</a>`,
      clickTrackingEnabled: true,
    })

    await sleep(2000)

    const { messages: allMessages } = await getAllMailpitMessages()

    const [message] = allMessages
      ? allMessages.filter((message) => message.Subject === injectEmail.subject)
      : []

    const { $ } = await getMailpitMessageSource(message.ID)

    const links: string[] = []

    $('a').each((idx, element) => {
      links.push($(element).attr('href') as string)
    })

    expect(links[0]).toContain(
      `https://${sendingDomain.trackingSubDomain}.${sendingDomain.name}/c/`,
    )
  })

  test('@open-tracking tracks when an email is opened', async ({ expect }) => {
    const app = makeApp()
    const { TEST_DOMAIN, team, sendingDomain } =
      await setupDomainForDnsChecks('localgmail.net')

    const { injectEmail, response: injectResponse } = await injectEmailForTeam(
      team.id,
      TEST_DOMAIN,
    )

    await sleep(2000)

    const json = await injectResponse.json()

    // biome-ignore lint/suspicious/noExplicitAny: API response type
    const messageIds = json.messages.map((message: any) => message.messageId)

    const { messages: allMessages } = await getAllMailpitMessages()

    const [message] = allMessages
      ? allMessages.filter((message) => message.Subject === injectEmail.subject)
      : []

    const { $ } = await getMailpitMessageSource(message.ID)

    const imageSources: string[] = []

    $('img').each((_, element) => {
      imageSources.push($(element).attr('src') as string)
    })

    const sendingDomainLink = `https://${sendingDomain.trackingSubDomain}.${sendingDomain.name}/o/`

    const trackingLink = imageSources.find((source) =>
      source.includes(sendingDomainLink),
    ) as string

    const [, signature] = trackingLink ? trackingLink.split(sendingDomainLink) : []

    const unsigned = new SignedUrlManager(appEnv.APP_KEY).decode(signature)

    expect(unsigned?.original).toBeDefined()

    const emailSend = await container
      .make(EmailSendRepository)
      .findById(unsigned?.original as string)

    expect(emailSend).toBeDefined()

    const response = await app.request(`/o/${signature}`, {
      headers: {
        'x-forwarded-for': xForwardedFor,
        'user-agent': userAgent,
      },
    })

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toEqual('image/png')

    const jobs = await Queue.mta_logs().getJobs()

    const openJobs = jobs
      .filter(
        (job) =>
          messageIds.includes(job.data.log?.headers?.[appEnv.emailHeaders.emailSendId]) &&
          job.data.log?.type === 'Open',
      )
      .map((job) => job.data.log)

    expect(openJobs).toHaveLength(1)

    for (const job of openJobs) {
      expect(job.ipv4_address).toEqual(xForwardedFor)
      expect(job.user_agent).toEqual(userAgent)
      expect(job.timestamp).toBeDefined()
    }
  })

  test('@open-tracking does not track opens when open tracking is disabled', async ({
    expect,
  }) => {
    const app = makeApp()
    const { TEST_DOMAIN, team } = await setupDomainForDnsChecks('localgmail.net')

    const linkInEmail = 'https://google.com'

    const { injectEmail } = await injectEmailForTeam(team.id, TEST_DOMAIN, {
      html: `<a href="${linkInEmail}" disable-tracking="true">View my home page.</a>`,
      openTrackingEnabled: false,
    })

    await sleep(2000)

    const { messages: allMessages } = await getAllMailpitMessages()

    const [message] = allMessages
      ? allMessages.filter((message) => message.Subject === injectEmail.subject)
      : []

    const { $ } = await getMailpitMessageSource(message.ID)

    const images: string[] = []

    $('img').each((idx, element) => {
      images.push($(element).attr('src') as string)
    })

    expect(images).toHaveLength(0)
  })

  test('@open-tracking can track opens for an email even when tracking is disabled for domain', async ({
    expect,
  }) => {
    const { TEST_DOMAIN, team, sendingDomain } = await setupDomainForDnsChecks(
      'localgmail.net',
      {
        openTrackingEnabled: false,
        clickTrackingEnabled: false,
      },
    )

    const linkInEmail = 'https://google.com'

    const { injectEmail } = await injectEmailForTeam(team.id, TEST_DOMAIN, {
      html: `<a href="${linkInEmail}" disable-tracking="true">View my home page.</a>`,
      openTrackingEnabled: true,
    })

    await sleep(2000)

    const { messages: allMessages } = await getAllMailpitMessages()

    const [message] = allMessages
      ? allMessages.filter((message) => message.Subject === injectEmail.subject)
      : []

    const { $ } = await getMailpitMessageSource(message.ID)

    const images: string[] = []

    $('img').each((idx, element) => {
      images.push($(element).attr('src') as string)
    })

    expect(images).toHaveLength(1)
    expect(images[0]).toMatch(
      `https://${sendingDomain.trackingSubDomain}.${sendingDomain.name}/o/`,
    )
  })

  test('@send-broadcasts-to-contact job injects email into mta', async ({ expect }) => {
    const { user, audience, team, broadcastGroupId } = await createUser()

    const TEST_DOMAIN = 'localgmail.net'

    const { sendingDomainId } = await setupDomainForDnsChecks(TEST_DOMAIN, {
      product: 'engage',
      teamId: team.id,
    })

    // Create a sender identity for this test
    const senderIdentity = await container.make(SenderIdentityRepository).create({
      name: 'Test Sender',
      email: 'jonathan',
      sendingDomainId,
      teamId: team.id,
    })

    const broadcastId = await createBroadcastForUser(
      user,
      team.id,
      audience.id,
      broadcastGroupId,
      {
        updateWithValidContent: true,
        sendingDomainId,
        senderIdentityId: senderIdentity.id,
      },
    )

    const { id: contactId } = await container.make(ContactRepository).create(
      {
        email: `${v1()}@${TEST_DOMAIN}`,
      },
      audience as Audience,
    )

    const { output } = await container.make(SendBroadcastToContact).handle({
      payload: { broadcastId, contactId },
      database: makeDatabase(),
      redis: makeRedis(),
      logger: makeLogger(),
    })

    expect(
      output && Array.isArray(output) && 'ok' in output[0],
      'The output from the MTA inject job was unsuccessful.',
    ).toBe(true)

    const [message] = output as { messageId: string; ok: boolean }[]

    await sleep(2000)

    const jobs = await Queue.mta_logs().getJobs()

    const logJobs = jobs.filter(
      (job) =>
        job.data.log?.headers?.[appEnv.emailHeaders.emailSendId] === message.messageId,
    )

    expect(logJobs).toHaveLength(2)

    expect(
      logJobs.map((job) => ({
        type: job.data.log.type,
        headers: {
          [appEnv.emailHeaders.broadcastId]:
            job.data.log.headers[appEnv.emailHeaders.broadcastId],
          [appEnv.emailHeaders.emailSendId]:
            job.data.log.headers[appEnv.emailHeaders.emailSendId],
        },
      })),
    ).toMatchObject([
      {
        type: 'Delivery',
        headers: {
          [appEnv.emailHeaders.broadcastId]: broadcastId,
          [appEnv.emailHeaders.emailSendId]: message.messageId,
        },
      },
      {
        type: 'Reception',
        headers: {
          [appEnv.emailHeaders.broadcastId]: broadcastId,
          [appEnv.emailHeaders.emailSendId]: message.messageId,
        },
      },
    ])
  })
})
