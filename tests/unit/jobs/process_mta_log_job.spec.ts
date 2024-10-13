import { apiEnv } from "@/api/env/api_env.js"
import { EmailSendRepository } from "@/email_sends/repositories/email_send_repository.js"
import { ProcessMtaLogJob } from "@/kumologs/jobs/process_mta_log_job.js"
import { DateTime } from "luxon"
import { v1 } from "uuid"
import { describe, it } from "vitest"

import { setupDomainForDnsChecks } from "@/tests/unit/jobs/check_sending_domain_dns_configuration_job.spec.js"

import { makeDatabase, makeRedis } from "@/shared/container/index.js"
import { MtaLog } from "@/shared/types/mta.js"

import { container } from "@/utils/typi.js"

describe("@process-mta-log", () => {
  it("transforms and stores click and open logs", async ({ expect }) => {
    const xForwardedFor = "160.242.45.138"
    const userAgent =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36"

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

      expect(event).toMatchObject({
        type: eventType,
        originCountry: "NA",
        originState: "Khomas Region",
        originCity: "Windhoek",
        originDevice: "Macintosh",
        originBrowser: "Chrome",
      })
    }
  })
})
