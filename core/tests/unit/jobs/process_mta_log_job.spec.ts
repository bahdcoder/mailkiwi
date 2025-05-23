import { appEnv } from '#root/core/app/env/app_env.js'
import { EmailSendRepository } from '#root/core/email_sends/repositories/email_send_repository.js'
import { ProcessMtaLogJob } from '#root/core/kumologs/jobs/process_mta_log_job.js'
import { DateTime } from 'luxon'
import { v1 } from 'uuid'
import { describe, it } from 'vitest'

import { ContactRepository } from '#root/core/audiences/repositories/contact_repository.js'

import { createBroadcastForUser, createUser } from '#root/core/tests/mocks/auth/users.js'

import type { Audience } from '#root/database/database_schema_types.js'

import { makeDatabase, makeLogger, makeRedis } from '#root/core/shared/container/index.js'
import type { MtaLog } from '#root/core/shared/types/mta.js'

import { container } from '#root/core/utils/typi.js'
import { setupDomainForDnsChecks } from '#root/core/tests/unit/helpers/domains/setup_domain_for_dns_checks.js'

const xForwardedFor = '66.249.93.66'
const userAgent =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36'

describe('@process-mta-log', () => {
  it('transforms and stores click and open logs', async ({ expect }) => {
    const { sendingDomain } = await setupDomainForDnsChecks()

    const { id } = await container
      .make(EmailSendRepository)
      .create(v1(), { sendingDomainId: sendingDomain.id, product: 'send' })

    for (const eventType of ['Click', 'Open']) {
      await container.make(ProcessMtaLogJob).handle({
        payload: {
          log: {
            type: eventType,
            ip_address: xForwardedFor,
            user_agent: userAgent,
            headers: {
              [appEnv.emailHeaders.sendingDomainId]: sendingDomain.id,
              [appEnv.emailHeaders.emailSendId]: id,
            },
            timestamp: DateTime.now().toSeconds(),
          } as unknown as MtaLog,
        },
        database: makeDatabase(),
        redis: makeRedis(),
        logger: makeLogger(),
      })
    }

    const emailSend = await container.make(EmailSendRepository).findByIdWithEvents(id)

    for (const eventType of ['Click', 'Open']) {
      const event = emailSend.events?.find((event) => event.type === eventType)

      expect(event?.originState).toBeDefined()
      expect(event?.originCity).toBeDefined()
      expect(event?.originDevice).toBeDefined()
      expect(event?.originBrowser).toBeDefined()
      expect(event?.originCountry).toBeDefined()
    }
  })

  it('logs engage specific events and updates the contact information accordingly', async ({
    expect,
  }) => {
    const { user, audience, team, broadcastGroupId } = await createUser()

    const TEST_DOMAIN = 'localgmail.net'
    const { sendingDomain } = await setupDomainForDnsChecks(TEST_DOMAIN, {
      teamId: team.id,
    })

    await setupDomainForDnsChecks(TEST_DOMAIN, {
      product: 'engage',
      teamId: team.id,
    })

    const fromEmail = `mary.nathan@${TEST_DOMAIN}`

    const broadcastId = await createBroadcastForUser(
      user,
      team.id,
      audience.id,
      broadcastGroupId,
      {
        updateWithValidContent: true,
        emailContent: {
          fromEmail,
        },
      },
    )

    const { id } = await container.make(EmailSendRepository).create(v1(), {
      sendingDomainId: sendingDomain.id,
      product: 'engage',
    })

    const { id: contactId } = await container.make(ContactRepository).create(
      {
        email: `${v1()}@${TEST_DOMAIN}`,
      },
      audience as Audience,
    )

    function getLog(type?: string) {
      return {
        type: type,
        ip_address: xForwardedFor,
        user_agent: userAgent,
        headers: {
          [appEnv.emailHeaders.sendingDomainId]: sendingDomain.id,
          [appEnv.emailHeaders.emailSendId]: id,
          [appEnv.emailHeaders.contactId]: contactId,
          [appEnv.emailHeaders.broadcastId]: broadcastId,
        },
        timestamp: DateTime.now().toSeconds(),
      } as unknown as MtaLog
    }

    await container.make(ProcessMtaLogJob).handle({
      payload: {
        log: getLog('Click'),
      },
      database: makeDatabase(),
      redis: makeRedis(),
      logger: makeLogger(),
    })

    await container.make(ProcessMtaLogJob).handle({
      payload: {
        log: getLog('Open'),
      },
      database: makeDatabase(),
      redis: makeRedis(),
      logger: makeLogger(),
    })

    const contact = await container.resolve(ContactRepository).findById(contactId)

    expect(contact?.lastClickedBroadcastEmailLinkAt).toBeDefined()
    expect(contact?.lastOpenedBroadcastEmailAt).toBeDefined()
  })
})
