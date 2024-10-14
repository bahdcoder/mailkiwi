import { apiEnv } from "@/api/env/api_env.js"
import { EmailSendRepository } from "@/email_sends/repositories/email_send_repository.js"
import { ProcessMtaLogJob } from "@/kumologs/jobs/process_mta_log_job.js"
import { DateTime } from "luxon"
import { v1 } from "uuid"
import { describe, it } from "vitest"

import { ContactRepository } from "@/audiences/repositories/contact_repository.js"

import {
  createBroadcastForUser,
  createUser,
} from "@/tests/mocks/auth/users.js"
import { setupDomainForDnsChecks } from "@/tests/unit/jobs/check_sending_domain_dns_configuration_job.spec.js"

import { makeDatabase, makeRedis } from "@/shared/container/index.js"
import { MtaLog } from "@/shared/types/mta.js"

import { container } from "@/utils/typi.js"

export const xForwardedFor = "66.249.93.66"
export const userAgent =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36"

describe("@process-mta-log", () => {
  it("transforms and stores click and open logs", async ({ expect }) => {
    const { sendingDomain } = await setupDomainForDnsChecks()

    const { id } = await container
      .make(EmailSendRepository)
      .create(v1(), { sendingDomainId: sendingDomain.id, product: "send" })

    for (const eventType of ["Click", "Open"]) {
      await container.make(ProcessMtaLogJob).handle({
        payload: {
          log: {
            type: eventType,
            ip_address: xForwardedFor,
            user_agent: userAgent,
            headers: {
              [apiEnv.emailHeaders.sendingDomainId]: sendingDomain.id,
              [apiEnv.emailHeaders.emailSendId]: id,
            },
            timestamp: DateTime.now().toSeconds(),
          } as unknown as MtaLog,
        },
        database: makeDatabase(),
        redis: makeRedis(),
      })
    }

    const emailSend = await container
      .make(EmailSendRepository)
      .findByIdWithEvents(id)

    for (const eventType of ["Click", "Open"]) {
      const event = emailSend.events?.find(
        (event) => event.type === eventType,
      )

      expect(event?.originState).toBeDefined()
      expect(event?.originCity).toBeDefined()
      expect(event?.originDevice).toBeDefined()
      expect(event?.originBrowser).toBeDefined()
      expect(event?.originCountry).toBeDefined()
    }
  })

  it("logs engage specific events and updates the contact information accordingly", async ({
    expect,
  }) => {
    const { user, audience, team } = await createUser()

    const TEST_DOMAIN = "localgmail.net"
    const { sendingDomain } = await setupDomainForDnsChecks(TEST_DOMAIN, {
      teamId: team.id,
    })

    await setupDomainForDnsChecks(TEST_DOMAIN, {
      product: "engage",
      teamId: team.id,
    })

    const fromEmail = "mary.nathan@" + TEST_DOMAIN

    const broadcastId = await createBroadcastForUser(user, audience.id, {
      updateWithValidContent: true,
      emailContent: {
        fromEmail,
      },
    })

    const { id } = await container.make(EmailSendRepository).create(v1(), {
      sendingDomainId: sendingDomain.id,
      product: "engage",
    })

    const { id: contactId } = await container
      .make(ContactRepository)
      .create(
        {
          email: v1() + "@" + TEST_DOMAIN,
        },
        audience.id,
      )

    function getLog(type?: string) {
      return {
        type: type,
        ip_address: xForwardedFor,
        user_agent: userAgent,
        headers: {
          [apiEnv.emailHeaders.sendingDomainId]: sendingDomain.id,
          [apiEnv.emailHeaders.emailSendId]: id,
          [apiEnv.emailHeaders.contactId]: contactId,
          [apiEnv.emailHeaders.broadcastId]: broadcastId,
        },
        timestamp: DateTime.now().toSeconds(),
      } as unknown as MtaLog
    }

    await container.make(ProcessMtaLogJob).handle({
      payload: {
        log: getLog("Click"),
      },
      database: makeDatabase(),
      redis: makeRedis(),
    })

    await container.make(ProcessMtaLogJob).handle({
      payload: {
        log: getLog("Open"),
      },
      database: makeDatabase(),
      redis: makeRedis(),
    })

    const contact = await container
      .resolve(ContactRepository)
      .findById(contactId)

    expect(contact?.lastClickedBroadcastEmailLinkAt).toBeDefined()
    expect(contact?.lastOpenedBroadcastEmailAt).toBeDefined()
  })
})
